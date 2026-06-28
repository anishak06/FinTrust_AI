package com.fintrust.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fintrust.backend.model.*;
import com.fintrust.backend.repository.*;
import com.fintrust.backend.security.UserPrincipal;
import com.fintrust.backend.service.AuditLogService;
import com.fintrust.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/credit")
public class CreditController {

    @Autowired
    private FinancialDataRepository financialDataRepository;

    @Autowired
    private CreditScoreRepository creditScoreRepository;

    @Autowired
    private LoanAssessmentRepository loanAssessmentRepository;

    @Autowired
    private AiRecommendationRepository aiRecommendationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private com.fintrust.backend.repository.QrVerificationTokenRepository qrVerificationTokenRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/assess")
    public ResponseEntity<?> assessCredit(@RequestBody Map<String, Object> request) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = principal.getId();

        try {
            // 1. Ingest inputs safely
            double income = Double.parseDouble(request.get("monthlyIncome").toString());
            double expenses = Double.parseDouble(request.get("monthlyExpenses").toString());
            double savings = Double.parseDouble(request.get("monthlySavings").toString());
            int transactions = Integer.parseInt(request.get("upiTransactionFrequency").toString());
            String employmentType = request.get("employmentType").toString();
            String occupation = request.get("occupation").toString();
            String selfReportedConsistency = request.get("utilityBillConsistency").toString();

            LocalDateTime now = LocalDateTime.now();
            String month = request.containsKey("month") ? request.get("month").toString() : now.getMonth().toString().substring(0, 1) + now.getMonth().toString().substring(1).toLowerCase();
            int year = request.containsKey("year") ? Integer.parseInt(request.get("year").toString()) : now.getYear();

            // Save occupation back to User profile if not set
            userRepository.findById(userId).ifPresent(user -> {
                if (!StringUtils.hasText(user.getOccupation())) {
                    user.setOccupation(occupation);
                    userRepository.save(user);
                }
            });

            // 2. Bill Payment Consistency calculation (Self-reported only)
            double billConsistencyPct = 100.0;
            if ("CONSISTENT".equalsIgnoreCase(selfReportedConsistency)) {
                billConsistencyPct = 100.0;
            } else if ("SEMI_CONSISTENT".equalsIgnoreCase(selfReportedConsistency)) {
                billConsistencyPct = 80.0;
            } else {
                billConsistencyPct = 40.0;
            }

            // 3. Scoring Points Calculations (Deterministic Weighted Engine)
            
            // A. Savings Ratio (30%)
            double savingsRatio = savings / (income > 0 ? income : 1.0);
            int savingsPoints = 20;
            if (savings == 0) {
                savingsPoints = 0;
            } else if (savingsRatio >= 0.30) {
                savingsPoints = 100;
            } else if (savingsRatio >= 0.20) {
                savingsPoints = 80;
            } else if (savingsRatio >= 0.10) {
                savingsPoints = 60;
            } else if (savingsRatio >= 0.05) {
                savingsPoints = 40;
            }

            // B. Bill Payment Consistency (25%)
            int billPoints = 20;
            if (billConsistencyPct >= 100.0) billPoints = 100;
            else if (billConsistencyPct >= 90.0) billPoints = 80;
            else if (billConsistencyPct >= 75.0) billPoints = 60;
            else if (billConsistencyPct >= 50.0) billPoints = 40;

            // C. Income Stability (20%)
            int stabilityPoints = 40;
            String stabilityCategory = "Highly inconsistent";
            if ("SALARIED".equalsIgnoreCase(employmentType)) {
                stabilityPoints = 100;
                stabilityCategory = "Stable salaried income";
            } else if ("SELF_EMPLOYED".equalsIgnoreCase(employmentType)) {
                stabilityPoints = 80;
                stabilityCategory = "Consistent freelancer";
            } else if ("STUDENT".equalsIgnoreCase(employmentType)) {
                stabilityPoints = 60;
                stabilityCategory = "Moderately inconsistent";
            }

            // D. Expense Management (15%)
            double expenseRatio = expenses / (income > 0 ? income : 1.0);
            int expensePoints = 20;
            if (expenseRatio < 0.70) expensePoints = 100;
            else if (expenseRatio >= 0.70 && expenseRatio < 0.80) expensePoints = 80;
            else if (expenseRatio >= 0.80 && expenseRatio < 0.90) expensePoints = 60;
            else if (expenseRatio >= 0.90 && expenseRatio <= 1.00) expensePoints = 40;

            // E. Digital Transaction Activity (10%)
            int txnPoints = 20;
            if (transactions >= 100) txnPoints = 100;
            else if (transactions >= 50) txnPoints = 80;
            else if (transactions >= 20) txnPoints = 60;
            else if (transactions >= 10) txnPoints = 40;

            // Weighted scoring logic
            double weightedResult = (savingsPoints * 0.30) + 
                                    (billPoints * 0.25) + 
                                    (stabilityPoints * 0.20) + 
                                    (expensePoints * 0.15) + 
                                    (txnPoints * 0.10);

            // Bounded score translation (W from 20 to 100 -> Score from 300 to 900)
            int score = (int) Math.round(300.0 + ((weightedResult - 20.0) / 80.0) * 600.0);
            double expenseRatioPct = expenseRatio * 100.0;
            int penalty = 0;
            if (expenseRatioPct > 120.0) {
                penalty = 50;
            } else if (expenseRatioPct > 110.0) {
                penalty = 35;
            } else if (expenseRatioPct > 100.0) {
                penalty = 20;
            }
            score = score - penalty;
            score = Math.max(300, Math.min(900, score));

            String riskLevel = score >= 750 ? "Low Risk" : (score >= 600 ? "Medium Risk" : "High Risk");

            // Build Explainable Score Breakdown JSON
            ArrayNode breakdownArray = objectMapper.createArrayNode();
            breakdownArray.add(createBreakdownNode("Savings Ratio (30%)", savingsPoints, "Savings rate is " + Math.round(savingsRatio * 100) + "% of income"));
            breakdownArray.add(createBreakdownNode("Bill Consistency (25%)", billPoints, "On-time payment rate verified at " + Math.round(billConsistencyPct) + "%"));
            breakdownArray.add(createBreakdownNode("Income Stability (20%)", stabilityPoints, "Stability categorized as " + stabilityCategory));
            breakdownArray.add(createBreakdownNode("Expense Management (15%)", expensePoints, "Expense ratio is " + Math.round(expenseRatio * 100) + "% of income"));
            breakdownArray.add(createBreakdownNode("Digital Transactions (10%)", txnPoints, "Digital footprint verified at " + transactions + " txns/month"));

            // 4. Loan Eligibility Underwriting (Backend Only)
            boolean loanEligible = score >= 550;
            double suggestedAmount = 0.0;
            String riskCategory = "High";

            if (score >= 750) {
                suggestedAmount = savings * 12.0;
                riskCategory = "Low";
            } else if (score >= 650) {
                suggestedAmount = savings * 8.0;
                riskCategory = "Moderate";
            } else if (score >= 550) {
                suggestedAmount = savings * 4.0;
                riskCategory = "High";
            }

            // 5. Database Persistence Loops
            // Upsert FinancialData
            FinancialData fd = financialDataRepository.findByUserIdAndMonthAndYear(userId, month, year).orElse(new FinancialData());
            fd.setUserId(userId);
            fd.setMonth(month);
            fd.setYear(year);
            fd.setIncome(income);
            fd.setSavings(savings);
            fd.setExpenses(expenses);
            fd.setIncomeStability(stabilityCategory);
            fd.setTransactionCount(transactions);
            fd.setPaymentConsistency(billConsistencyPct);
            financialDataRepository.save(fd);

            // Upsert CreditScore
            CreditScore cs = creditScoreRepository.findByUserIdAndMonthAndYear(userId, month, year).orElse(new CreditScore());
            cs.setUserId(userId);
            cs.setMonth(month);
            cs.setYear(year);
            cs.setScore(score);
            cs.setRiskLevel(riskLevel);
            cs.setScoreBreakdown(objectMapper.writeValueAsString(breakdownArray));
            creditScoreRepository.save(cs);

            // Upsert LoanAssessment
            LoanAssessment la = loanAssessmentRepository.findByUserIdAndMonthAndYear(userId, month, year).orElse(new LoanAssessment());
            la.setUserId(userId);
            la.setMonth(month);
            la.setYear(year);
            la.setEligibility(loanEligible);
            la.setLoanAmount(suggestedAmount);
            la.setRiskCategory(riskCategory);
            loanAssessmentRepository.save(la);

            // Calculate Financial Health Score for Gemini
            int healthExpensePoints = 20;
            if (expenseRatio <= 0.70) healthExpensePoints = 100;
            else if (expenseRatio <= 0.80) healthExpensePoints = 80;
            else if (expenseRatio <= 0.90) healthExpensePoints = 60;
            else if (expenseRatio <= 1.00) healthExpensePoints = 40;

            int healthSavingsPoints = 20;
            if (savings == 0) healthSavingsPoints = 0;
            else if (savingsRatio >= 0.30) healthSavingsPoints = 100;
            else if (savingsRatio >= 0.20) healthSavingsPoints = 80;
            else if (savingsRatio >= 0.10) healthSavingsPoints = 60;
            else if (savingsRatio >= 0.05) healthSavingsPoints = 40;

            int healthScore = (int) Math.round((healthExpensePoints * 0.40) + (healthSavingsPoints * 0.30) + (billConsistencyPct * 0.20) + (stabilityPoints * 0.10));
            String overspendingRisk = "Low";
            if (expenseRatioPct > 120.0) {
                overspendingRisk = "Critical";
            } else if (expenseRatioPct > 100.0) {
                overspendingRisk = "High";
            } else if (expenseRatioPct > 90.0) {
                overspendingRisk = "Moderate";
            }

            // 6. Invoke Gemini AI (Insights Only, PII Strip Enforced)
            AiRecommendation rec = geminiService.generateFinancialInsights(
                    userId, score, income, savings, expenses, billConsistencyPct, transactions, loanEligible, suggestedAmount, month, year,
                    expenseRatioPct, overspendingRisk, penalty, healthScore
            );

            // 7. Audit Logging
            auditLogService.logAction(userId, "CREDIT_SCORE_GENERATION", "SUCCESS");
            auditLogService.logAction(userId, "LOAN_ELIGIBILITY_CHECK", "SUCCESS");
            auditLogService.logAction(userId, "RECOMMENDATION_GENERATION", "SUCCESS");

            // 8. Return Consolidated backward-compatible dashboard response
            Map<String, Object> dashboardRes = buildConsolidatedResponse(fd, cs, la, rec);
            return ResponseEntity.ok(dashboardRes);

        } catch (Exception e) {
            auditLogService.logAction(userId, "CREDIT_ASSESS_FAILED", "EXCEPTION");
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid assessment payload fields or parsing error."));
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestAssessment(@RequestParam(required = false) String month, @RequestParam(required = false) Integer year) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = principal.getId();

        LocalDateTime now = LocalDateTime.now();
        String targetMonth = month != null ? month : now.getMonth().toString().substring(0, 1) + now.getMonth().toString().substring(1).toLowerCase();
        Integer targetYear = year != null ? year : now.getYear();

        Optional<CreditScore> latestScore = creditScoreRepository.findByUserIdAndMonthAndYear(userId, targetMonth, targetYear);
        if (latestScore.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No assessments found for " + targetMonth + " " + targetYear + "."));
        }

        FinancialData latestData = financialDataRepository.findByUserIdAndMonthAndYear(userId, targetMonth, targetYear).orElse(new FinancialData());
        LoanAssessment latestLoan = loanAssessmentRepository.findByUserIdAndMonthAndYear(userId, targetMonth, targetYear).orElse(new LoanAssessment());
        AiRecommendation latestRec = aiRecommendationRepository.findByUserIdAndMonthAndYear(userId, targetMonth, targetYear).orElse(new AiRecommendation());

        return ResponseEntity.ok(buildConsolidatedResponse(latestData, latestScore.get(), latestLoan, latestRec));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getAssessmentHistory() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = principal.getId();

        List<CreditScore> scoreHistory = creditScoreRepository.findByUserIdOrderByCalculationDateDesc(userId);
        List<Map<String, Object>> list = new ArrayList<>();

        for (CreditScore cs : scoreHistory) {
            Map<String, Object> map = new HashMap<>();
            map.put("score", cs.getScore());
            map.put("createdAt", cs.getCalculationDate());
            map.put("month", cs.getMonth());
            map.put("year", cs.getYear());
            
            Optional<FinancialData> fdOpt = financialDataRepository.findByUserIdAndMonthAndYear(userId, cs.getMonth(), cs.getYear());
            if (fdOpt.isPresent()) {
                map.put("income", fdOpt.get().getIncome());
                map.put("expenses", fdOpt.get().getExpenses());
                map.put("savings", fdOpt.get().getSavings());
            }

            list.add(map);
        }
        return ResponseEntity.ok(list);
    }

    private ObjectNode createBreakdownNode(String factor, int points, String desc) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("factor", factor);
        node.put("points", points);
        node.put("description", desc);
        return node;
    }

    private Map<String, Object> buildConsolidatedResponse(FinancialData fd, CreditScore cs, LoanAssessment la, AiRecommendation rec) {
        Map<String, Object> map = new HashMap<>();
        map.put("score", cs.getScore());
        map.put("riskCategory", cs.getRiskLevel()); // Maps to Low Risk, Medium Risk, High Risk
        
        // Calculate health status based on score thresholds
        String health = "Poor";
        if (cs.getScore() >= 750) health = "Excellent";
        else if (cs.getScore() >= 650) health = "Good";
        else if (cs.getScore() >= 550) health = "Fair";
        map.put("healthStatus", health);
        
        double income = fd.getIncome() != null ? fd.getIncome() : 0.0;
        double expenses = fd.getExpenses() != null ? fd.getExpenses() : 0.0;
        double savings = fd.getSavings() != null ? fd.getSavings() : 0.0;
        
        map.put("monthlyIncome", income);
        map.put("monthlyExpenses", expenses);
        map.put("monthlySavings", savings);
        map.put("upiTransactionFrequency", fd.getTransactionCount());
        map.put("loanEligible", la.getEligibility());
        map.put("suggestedLoanAmount", la.getLoanAmount());
        map.put("scoreBreakdown", cs.getScoreBreakdown());
        map.put("recommendations", rec.getRecommendations());
        map.put("strengths", rec.getStrengths());
        map.put("weaknesses", rec.getWeaknesses());
        map.put("createdAt", cs.getCalculationDate());

        // Dynamic calculation of new requested metrics
        double expenseRatio = (expenses / (income > 0 ? income : 1.0)) * 100.0;
        map.put("expenseRatio", Math.round(expenseRatio * 10.0) / 10.0);

        String overspendingRisk = "Low";
        int penalty = 0;
        if (expenseRatio > 120.0) {
            overspendingRisk = "Critical";
            penalty = 50;
        } else if (expenseRatio > 110.0) {
            overspendingRisk = "High";
            penalty = 35;
        } else if (expenseRatio > 100.0) {
            overspendingRisk = "High";
            penalty = 20;
        } else if (expenseRatio > 90.0) {
            overspendingRisk = "Moderate";
        }
        map.put("overspendingRiskLevel", overspendingRisk);
        map.put("creditScorePenalty", penalty);

        // Financial Health Score Components
        int healthExpensePoints = 20;
        if (expenseRatio <= 70.0) healthExpensePoints = 100;
        else if (expenseRatio <= 80.0) healthExpensePoints = 80;
        else if (expenseRatio <= 90.0) healthExpensePoints = 60;
        else if (expenseRatio <= 100.0) healthExpensePoints = 40;

        double savingsRatio = savings / (income > 0 ? income : 1.0);
        int healthSavingsPoints = 20;
        if (savings == 0) healthSavingsPoints = 0;
        else if (savingsRatio >= 0.30) healthSavingsPoints = 100;
        else if (savingsRatio >= 0.20) healthSavingsPoints = 80;
        else if (savingsRatio >= 0.10) healthSavingsPoints = 60;
        else if (savingsRatio >= 0.05) healthSavingsPoints = 40;

        double billConsistencyPct = fd.getPaymentConsistency() != null ? fd.getPaymentConsistency() : 100.0;

        int stabilityPoints = 40;
        if (fd.getIncomeStability() != null) {
            if (fd.getIncomeStability().toLowerCase().contains("salaried")) stabilityPoints = 100;
            else if (fd.getIncomeStability().toLowerCase().contains("freelancer")) stabilityPoints = 80;
            else stabilityPoints = 60;
        }

        int healthScore = (int) Math.round((healthExpensePoints * 0.40) + (healthSavingsPoints * 0.30) + (billConsistencyPct * 0.20) + (stabilityPoints * 0.10));
        map.put("financialHealthScore", healthScore);

        String healthLabel = "Poor";
        if (healthScore >= 90) healthLabel = "Excellent";
        else if (healthScore >= 75) healthLabel = "Good";
        else if (healthScore >= 60) healthLabel = "Average";
        map.put("financialHealthScoreLabel", healthLabel);

        // AI Financial Risk Insight and Recommendation parser
        String geminiInsights = rec.getGeminiInsights();
        String parsedInsights = "No AI insights generated yet for this borrower.";
        String parsedHealthExplanation = "Your financial health profile indicates a solid foundation. Focus on optimizing savings behavior and maintaining a low expense-to-income ratio.";
        
        if (geminiInsights != null) {
            String[] parts = geminiInsights.split("\\[Underwriting Decision Details\\]:");
            parsedInsights = parts[0].trim();
            if (parts.length > 1) {
                String[] subParts = parts[1].split("\\[Financial Health Details\\]:");
                if (subParts.length > 1) {
                    parsedHealthExplanation = subParts[1].trim();
                }
            }
        }
        map.put("geminiInsights", parsedInsights);
        map.put("financialHealthExplanation", parsedHealthExplanation);

        return map;
    }

    @GetMapping(value = "/verify-profile/{nonce}", produces = "text/html")
    public ResponseEntity<String> verifyProfile(@PathVariable String nonce) {
        Optional<QrVerificationToken> tokenOpt = qrVerificationTokenRepository.findByToken(nonce);
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(404).body("<html><body><h2>Invalid or expired token</h2></body></html>");
        }

        QrVerificationToken token = tokenOpt.get();
        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body("<html><body><h2>Token expired or already used</h2></body></html>");
        }

        // Mark as used
        token.setUsed(true);
        qrVerificationTokenRepository.save(token);

        Long userId = token.getUserId();
        User user = userRepository.findById(userId).orElseThrow();

        // Get latest assessment
        List<CreditScore> scoreHistory = creditScoreRepository.findByUserIdOrderByCalculationDateDesc(userId);
        if (scoreHistory.isEmpty()) {
            return ResponseEntity.ok("<html><body><h2>Profile Verified: " + user.getFullName() + "</h2><p>No credit assessments found.</p></body></html>");
        }

        CreditScore latestScore = scoreHistory.get(0);
        String healthStatus = latestScore.getScore() >= 750 ? "Excellent" : (latestScore.getScore() >= 650 ? "Good" : "Fair/Poor");

        String html = "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Verified Financial Profile</title>\n" +
                "    <style>\n" +
                "        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 20px; display: flex; justify-content: center; }\n" +
                "        .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 30px; max-width: 500px; width: 100%; }\n" +
                "        .header { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }\n" +
                "        .header h1 { margin: 0 0 10px 0; color: #111827; }\n" +
                "        .badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-weight: bold; font-size: 0.875rem; background-color: #dcfce7; color: #166534; }\n" +
                "        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }\n" +
                "        .stat-box { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }\n" +
                "        .stat-label { font-size: 0.875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }\n" +
                "        .stat-value { font-size: 1.5rem; font-weight: bold; color: #111827; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"card\">\n" +
                "        <div class=\"header\">\n" +
                "            <h1>" + user.getFullName() + "</h1>\n" +
                "            <p>" + user.getEmail() + "</p>\n" +
                "            <div class=\"badge\">Verified User</div>\n" +
                "        </div>\n" +
                "        <div class=\"stat-grid\">\n" +
                "            <div class=\"stat-box\">\n" +
                "                <div class=\"stat-label\">Alternative Score</div>\n" +
                "                <div class=\"stat-value\">" + latestScore.getScore() + "</div>\n" +
                "            </div>\n" +
                "            <div class=\"stat-box\">\n" +
                "                <div class=\"stat-label\">Risk Tier</div>\n" +
                "                <div class=\"stat-value\">" + latestScore.getRiskLevel() + "</div>\n" +
                "            </div>\n" +
                "            <div class=\"stat-box\">\n" +
                "                <div class=\"stat-label\">Health Status</div>\n" +
                "                <div class=\"stat-value\">" + healthStatus + "</div>\n" +
                "            </div>\n" +
                "            <div class=\"stat-box\">\n" +
                "                <div class=\"stat-label\">Last Updated</div>\n" +
                "                <div class=\"stat-value\" style=\"font-size: 1rem;\">" + latestScore.getCalculationDate().toLocalDate().toString() + "</div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        <div style=\"text-align: center; margin-top: 30px; font-size: 0.875rem; color: #9ca3af;\">\n" +
                "            Securely generated by FinTrust AI\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";

        return ResponseEntity.ok(html);
    }
}
