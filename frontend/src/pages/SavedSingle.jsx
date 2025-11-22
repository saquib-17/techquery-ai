import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyQuestions, deleteQuestions } from "../services/api";
import { updateTitle } from "../services/api";
import { jsPDF } from "jspdf";
import { generateAnswers } from "../services/api";

export default function SavedSingle() {
  const { id } = useParams();

  const [setData, setSetData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const { data } = await getMyQuestions();
      const found = data.data.find((s) => s._id === id);
      setSetData(found || null);
    } catch {
      alert("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Delete this question set?");

    if (!confirmDelete) return;

    try {
      await deleteQuestions(id);
      alert("Deleted successfully!");
      navigate("/saved");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleRename = async () => {
    const newTitle = prompt("Enter new title:", setData.title);

    if (!newTitle || newTitle.trim() === "") return;

    try {
      await updateTitle(id, newTitle.trim());
      alert("Updated!");

      // update UI without refresh
      setSetData((prev) => ({ ...prev, title: newTitle.trim() }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };


  const handleExportPDF = () => {
  if (!setData) return;

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4"
  });

  const marginX = 40;
  let y = 70;

  // Title
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(setData.title, marginX, y);
  y += 30;

  // Section Title
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("INTERVIEW QUESTIONS", marginX, y);
  y += 14;

  // Separator
  pdf.setLineWidth(0.8);
  pdf.line(marginX, y, 550, y);
  y += 22;

  // Questions
  setData.questions.forEach((q, i) => {

    if (y > 780) {
      pdf.addPage();
      y = 60;
    }

    // Q Label
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Q${i + 1}:`, marginX, y);
    y += 14;

    const wrapped = pdf.splitTextToSize(q, 500);

    // Question text
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(wrapped, marginX + 20, y);

    y += wrapped.length * 14;
    y += 12;
  });

  pdf.save(`${setData.title}-Questions.pdf`);
};



const handleExportAnswersPDF = () => {
  if (!answers || answers.length === 0) {
    alert("Generate answers first!");
    return;
  }

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4"
  });

  const marginX = 40;
  let y = 70;

  // Title
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${setData.title} — Answer Guide`, marginX, y);
  y += 30;

  // Section Title
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("AI GENERATED INTERVIEW ANSWERS", marginX, y);
  y += 14;

  // Separator
  pdf.setLineWidth(0.8);
  pdf.line(marginX, y, 550, y);
  y += 22;

  setData.questions.forEach((q, i) => {

    if (y > 780) {
      pdf.addPage();
      y = 60;
    }

    // Question label
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Q${i + 1}:`, marginX, y);
    y += 14;

    // Wrapped question
    const wq = pdf.splitTextToSize(q, 500);
    pdf.setFont("helvetica", "normal");
    pdf.text(wq, marginX + 20, y);

    y += wq.length * 14 + 10;


    // Answer title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(`Answer:`, marginX + 20, y);
    y += 14;

    // Wrapped answer
    const wa = pdf.splitTextToSize(answers[i] || "Not available", 500);
    pdf.setFont("helvetica", "normal");
    pdf.text(wa, marginX + 20, y);

    y += wa.length * 14 + 20;
  });

  pdf.save(`${setData.title}-Answers.pdf`);
};




  const handleGenerateAnswers = async () => {
    try {
      setLoadingAnswers(true);

      const { data } = await generateAnswers(setData.questions);

      setAnswers(data.answers || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate answers");
    } finally {
      setLoadingAnswers(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (!setData) return <p className="text-gray-400">Not found.</p>;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-4 space-x-4">
      <h1 className="text-2xl font-medium text-white uppercase tracking-wider">{setData.title}</h1>

      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
      >
        Delete
      </button>

      <button
        onClick={handleRename}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm transition"
      >
        Rename
      </button>

      <button
        onClick={handleExportPDF}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
      >
        Export PDF
      </button>

      <button
        onClick={handleGenerateAnswers}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
      >
        {loadingAnswers ? "Generating..." : "Generate AI Answers"}
      </button>

      {answers.length > 0 && (
        <button
          onClick={handleExportAnswersPDF}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
        >
          Export Answers PDF
        </button>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        <span className="text-gray-100">Created on : </span>{new Date(setData.createdAt).toLocaleString()}
      </p>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-500 space-y-2">
        <ul className="list-disc pl-6 space-y-2 text-gray-800 dark:text-gray-200">
          {setData.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>

      {answers.length > 0 && (
        <div className="p-4 bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-300 space-y-2">
          <h2 className="text-lg font-medium text-white">AI Answers</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-800 dark:text-gray-100">
            {answers.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
