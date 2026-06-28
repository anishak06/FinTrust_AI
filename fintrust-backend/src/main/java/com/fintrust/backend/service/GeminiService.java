package com.fintrust.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fintrust.backend.model.AiRecommendation;
import com.fintrust.backend.repository.AiRecommendationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {
    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${app.gemini.url}")
    private String geminiUrl;

    @Value("${app.gemini.key}")
    private String geminiKey;

    @Autowired
    private AiRecommendationRepository aiRecommendationRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generates intelligent, data-driven financial insights using Gemini AI.
     * Scrubbed of all PII. Gemini does NOT calculate score, eligibility, or loan amounts.
     */
    public AiRecommendation generateFinancialInsights(
            Long userId, int score, double income, double savings, double expenses, double consistency, int transactions,
            boolean loanEligible, double suggestedLoanAmount, String month, Integer year,
            double expenseRatio, String overspendingRiskLevel, int penalty, int healthScore) {

        if (!StringUtils.hasText(geminiKey)) {
            logger.info("Gemini API key is not configured. Falling back to local rule-based insights engine.");
            return calculateLocalInsights(userId, score, income, savings, expenses, consistency, transactions, loanEligible, suggestedLoanAmount, month, year);
        }

        try {
            String prompt = buildInsightsPrompt(score, income, savings, expenses, consistency, transactions, loanEligible, suggestedLoanAmount, month, year, expenseRatio, overspendingRiskLevel, penalty, healthScore);
            String response = callGeminiApi(prompt);
            return parseInsightsResponse(userId, response, month, year);
        } catch (Exception e) {
            logger.error("Error generating insights via Gemini. Falling back to local engine.", e);
            return calculateLocalInsights(userId, score, income, savings, expenses, consistency, transactions, loanEligible, suggestedLoanAmount, month, year);
        }
    }

    private String buildInsightsPrompt(
            int score, double income, double savings, double expenses, double consistency, int transactions,
            boolean loanEligible, double suggestedLoanAmount, String month, Integer year,
            double expenseRatio, String overspendingRiskLevel, int penalty, int healthScore) {
        
        return "You are a friendly financial coach. Generate plain, simple, and encouraging financial insights for this person for " + month + " " + year + ":\n" +
                "- Credit Score: " + score + " / 900\n" +
                "- Monthly Income: \u20B9" + income + "\n" +
                "- Monthly Savings: \u20B9" + savings + "\n" +
                "- Monthly Expenses: \u20B9" + expenses + "\n" +
                "- Bill Payment Consistency: " + consistency + "%\n" +
                "- UPI Digital Transactions: " + transactions + " transactions/month\n" +
                "- Loan Eligibility Status: " + (loanEligible ? "ELIGIBLE" : "NOT ELIGIBLE") + "\n" +
                "- Suggested Loan Limit: \u20B9" + suggestedLoanAmount + "\n" +
                "- Expense-to-Income Ratio: " + Math.round(expenseRatio * 10.0) / 10.0 + "%\n" +
                "- Overspending Risk Level: " + overspendingRiskLevel + "\n" +
                "- Overspending Score Penalty Applied: " + penalty + " points\n" +
                "- Financial Health Score: " + healthScore + " / 100\n\n" +
                "Do NOT use complex financial jargon like 'liquidity buffers' or 'underwriting'. Use plain English that anyone can understand.\n" +
                "Evaluate and return exactly a JSON object (no markdown, no ```json, no extra text, just raw JSON) with the following structure:\n" +
                "{\n" +
                "  \"geminiInsights\": \"A friendly summary of how they are doing with their money this month, especially talking about their overspending risk and expense management.\",\n" +
                "  \"strengths\": [\n" +
                "     \"\u2705 First thing they are doing well...\",\n" +
                "     \"\u2705 Second thing they are doing well...\"\n" +
                "  ], // List what they are doing well based on data\n" +
                "  \"weaknesses\": [\n" +
                "     \"\u26A0 First thing to watch out for...\",\n" +
                "     \"\u26A0 Second thing to watch out for...\"\n" +
                "  ], // List areas to watch out for based on data\n" +
                "  \"loanEligibilityExplanation\": \"Explain simply WHY they can or cannot get a loan right now, based on their score and savings.\",\n" +
                "  \"recommendations\": [\n" +
                "     \"Try to save a bit more next month.\",\n" +
                "     \"Keep paying bills on time!\"\n" +
                "  ],\n" +
                "  \"financialHealthExplanation\": \"A short, friendly 1-2 sentence explanation of their Financial Health Score of " + healthScore + "/100 based on their savings behavior and expense ratio.\"\n" +
                "}";
    }

    private AiRecommendation parseInsightsResponse(Long userId, String responseStr, String month, Integer year) throws Exception {
        JsonNode root = objectMapper.readTree(responseStr);
        String jsonText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        
        if (jsonText.contains("```")) {
            jsonText = jsonText.replaceAll("```json|```", "").trim();
        }

        JsonNode result = objectMapper.readTree(jsonText);

        AiRecommendation rec = aiRecommendationRepository.findByUserIdAndMonthAndYear(userId, month, year).orElse(new AiRecommendation());
        rec.setUserId(userId);
        rec.setMonth(month);
        rec.setYear(year);
        rec.setGeminiInsights(result.path("geminiInsights").asText("Your cash flow and savings look good."));
        rec.setStrengths(objectMapper.writeValueAsString(result.path("strengths")));
        rec.setWeaknesses(objectMapper.writeValueAsString(result.path("weaknesses")));
        rec.setRecommendations(objectMapper.writeValueAsString(result.path("recommendations")));

        String rawInsights = result.path("geminiInsights").asText();
        String explanation = result.path("loanEligibilityExplanation").asText();
        String healthExplanation = result.path("financialHealthExplanation").asText("Your financial health is stable. Keep tracking non-essentials.");
        rec.setGeminiInsights(rawInsights + "\n\n[Underwriting Decision Details]: " + explanation + "\n\n[Financial Health Details]: " + healthExplanation);

        return aiRecommendationRepository.save(rec);
    }



    private AiRecommendation calculateLocalInsights(
            Long userId, int score, double income, double savings, double expenses, double consistency, int transactions,
            boolean loanEligible, double suggestedLoanAmount, String month, Integer year) {

        AiRecommendation rec = aiRecommendationRepository.findByUserIdAndMonthAndYear(userId, month, year).orElse(new AiRecommendation());
        rec.setUserId(userId);
        rec.setMonth(month);
        rec.setYear(year);
        
        // Formulate Strengths
        ArrayNode strengths = objectMapper.createArrayNode();
        if (savings / income >= 0.3) {
            strengths.add("\u2705 You consistently save over 30% of your monthly income.");
        } else if (savings / income >= 0.15) {
            strengths.add("\u2705 You maintain a healthy savings buffer of " + Math.round(savings / income * 100) + "%.");
        }
        if (consistency >= 90) {
            strengths.add("\u2705 Your bill payment history is excellent.");
        }
        if (expenses / income < 0.70) {
            strengths.add("\u2705 You are great at keeping expenses low.");
        }

        if (strengths.size() == 0) {
            strengths.add("\u2705 We have received your financial information.");
        }

        // Formulate Weaknesses
        ArrayNode weaknesses = objectMapper.createArrayNode();
        if (expenses / income >= 0.8) {
            weaknesses.add("\u26A0 Your spending is a bit high this month.");
        }
        if (savings / income < 0.15) {
            weaknesses.add("\u26A0 Saving a little more could really help in emergencies.");
        }
        if (consistency < 75) {
            weaknesses.add("\u26A0 Try to pay your bills on time to boost your score.");
        }
        if (weaknesses.size() == 0) {
            weaknesses.add("\u26A0 No major worries right now, keep it up!");
        }

        // Recommendations
        ArrayNode recs = objectMapper.createArrayNode();
        double targetSavings = Math.round(income * 0.30);
        recs.add("Aim to save around \u20B9" + targetSavings + " each month.");
        recs.add("Keep paying those bills on time!");
        if (expenses / income >= 0.7) {
            recs.add("See if you can spend a little less on non-essentials.");
        }
        recs.add("Keep your savings up to get better loan offers in the future.");

        // Insights & Explanation
        String insights = "Your credit score is " + score + ". You are doing fairly well!";
        String explanation = loanEligible ? "You can get a loan because you have a good score and solid savings!" 
                : "You need a score of 550 to qualify for a loan. Keep saving and paying bills to get there.";

        try {
            rec.setStrengths(objectMapper.writeValueAsString(strengths));
            rec.setWeaknesses(objectMapper.writeValueAsString(weaknesses));
            rec.setRecommendations(objectMapper.writeValueAsString(recs));
        } catch (Exception e) {
            rec.setStrengths("[]");
            rec.setWeaknesses("[]");
            rec.setRecommendations("[]");
        }

        String healthExplanation = "Your financial health profile indicates a solid foundation. Focus on optimizing savings behavior and maintaining a low expense-to-income ratio.";
        rec.setGeminiInsights(insights + "\n\n[Underwriting Decision Details]: " + explanation + "\n\n[Financial Health Details]: " + healthExplanation);
        return aiRecommendationRepository.save(rec);
    }

    private String callGeminiApi(String prompt) throws Exception {
        String url = geminiUrl + "?key=" + geminiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ObjectNode requestBody = objectMapper.createObjectNode();
        ArrayNode contents = requestBody.putArray("contents");
        ObjectNode content = contents.addObject();
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", prompt);

        ObjectNode generationConfig = requestBody.putObject("generationConfig");
        generationConfig.put("responseMimeType", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        return response.getBody();
    }


}
