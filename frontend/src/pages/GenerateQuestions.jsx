
import React, { useState } from "react";
import api from "../services/api";
import { saveQuestions } from "../services/api";
import { generateAnswers } from "../services/api";

export default function GenerateQuestions() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  const handleGenerate = async () => {
    if (!resume || !jd) return alert("Paste resume and job description");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-questions", {
        resumeText: resume,
        jobDescription: jd,
      });
      setQuestions(data.questions || []);
    } catch (err) {
      alert(err.response?.data?.message || "AI failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnswers = async () => {
    if (questions.length === 0) return alert("Generate questions first!");

    try {
      setLoadingAnswers(true);

      const { data } = await generateAnswers(questions);

      if (!data.success || !Array.isArray(data.answers)) {
        alert("AI failed to generate answers");
        return;
      }

      setAnswers(data.answers);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate answers");
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleSave = async () => {
    if (questions.length === 0) return alert("Generate questions first!");

    const title = prompt("Enter a title for this question set:");

    if (!title || title.trim() === "") return;

    try {
      await saveQuestions(title, questions);
      alert("Saved successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save");
    }
  };

  const handleReset = () => {
    setResume("");
    setJd("");
    setQuestions([]);
  };

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="max-w-7xl mx-auto space-y-5 sm:px-1 sm:py-1">
        {/* Top Section: Title & Intro */}
        <section className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            AI Interview Question Generator
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            Paste a resume and job description, and get 15–20 tailored questions
            split into easy, medium, hard, and company-specific sections.
          </p>
        </section>

        {/* Middle Section: Inputs + Actions */}
        <section className="bg-white dark:bg-primary rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
            <p className="text-xl font-bold text-white">
              Candidate & Role Details
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Better quality in → better questions out 💡
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Resume */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600 dark:text-gray-200 font-medium">
                Resume
              </label>
              <textarea
                rows="12"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste the resume here (skills, experience, projects, tools)..."
                className="w-full mt-1 p-4 bg-white dark:bg-primary border border-gray-300 dark:border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-indigo-600 focus:outline-none resize-none text-gray-800 dark:text-gray-100 text-sm"
              />
              <div className="flex justify-between items-center text-[12px] text-gray-500 dark:text-gray-400 flex-wrap gap-y-1">
                <span className="whitespace-normal">
                  Tip: Include tech stack and key projects.
                </span>
                <span className="shrink-0">{resume.length} chars</span>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600 dark:text-gray-200 font-medium">
                Job Description
              </label>
              <textarea
                rows="12"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the JD here (role, responsibilities, required skills)..."
                className="w-full mt-1 p-4 bg-white dark:bg-primary border border-gray-300 dark:border-gray-600 rounded-lg 
                  focus:ring-2 focus:ring-indigo-600 focus:outline-none resize-none text-gray-800 dark:text-gray-100 text-sm"
              />
              <div className="flex justify-between items-center text-[12px] text-gray-500 dark:text-gray-400 flex-wrap gap-y-1">
                <span className="whitespace-normal">
                  Tip: Add expectations, level (SDE-1, intern, etc.).
                </span>
                <span className="shrink-0">{jd.length} chars</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handleGenerate}
              className="btn-primary cursor-pointer px-6 py-2 hover:opacity-90 transition"
            >
              {loading ? "Generating..." : "Generate Questions"}
            </button>

            {questions.length > 0 && (
              <button
                onClick={handleGenerateAnswers}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition"
              >
                {loadingAnswers ? "Generating..." : "Generate Answers"}
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer text-sm"
            >
              Reset
            </button>

            {questions.length > 0 && (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition text-sm"
              >
                Save
              </button>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Output will include easy, medium, hard and company-specific
              questions in bullet format.
            </p>
          </div>
        </section>

        {/* Bottom Section: Output */}
        <section className="bg-white dark:bg-primary rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600 space-y-3">
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-50">
            Generated Questions
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The AI will structure the text into sections like: Easy, Medium,
            Hard, and Company-specific questions commonly asked.
          </p>

          <div className="mt-2 rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-primary max-h-[420px] overflow-auto p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {loading ? (
              "Thinking up questions based on this profile..."
            ) : questions.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="leading-relaxed">
                    {String(q).replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ul>
            ) : (
              "Your generated questions will appear here once you run the generator."
            )}
          </div>
        </section>
        {answers.length > 0 && (
          <section className="bg-white dark:bg-primary rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600 space-y-4">
            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-50">
              AI Answers
            </h3>

            <ul className="list-decimal pl-6 space-y-2 text-gray-300">
              {answers.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
