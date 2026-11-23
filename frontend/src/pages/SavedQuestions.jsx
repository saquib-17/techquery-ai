import React, { useEffect, useState } from "react";
import { getMyQuestions } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function SavedQuestions() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const { data } = await getMyQuestions();
      setSets(data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <h1 className="text-2xl font-bold text-white">Saved Question Sets</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : sets.length === 0 ? (
        <p className="text-gray-400">No saved sets yet.</p>
      ) : (
        <div className="space-y-4">
          {sets.map((set) => (
            <div
              key={set._id}
              onClick={() => navigate(`/saved/${set._id}`)}
              className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 cursor-pointer hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            >
              <p className="font-medium text-white text-lg uppercase">{set.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300">
                Created At : {new Date(set.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {set.questions.length} questions
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
