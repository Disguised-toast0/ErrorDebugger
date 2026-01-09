import { useEffect, useState } from "react";
import axios from "axios";
import { getErrors, getErrorById } from "../api/errors";
import { deleteError } from "../api/errors";

/* =======================
   JSON BUILDER (RECURSIVE)
   ======================= */

const buildErrorJson = (draft) => {
  const nodes = {};
  const resolutions = {};
  let nodeCounter = 1;
  let resolutionCounter = 1;

  const traverse = (questionId) => {
    const q = draft.questions.find((q) => q.id === questionId);
    const nodeId = `n${nodeCounter++}`;

    nodes[nodeId] = {
      question: q.text,
      branches: {},
    };

    ["YES", "NO"].forEach((branch) => {
      const branchData = q[branch]; // ✅ FIX

      if (branchData.type === "SOLUTION") {
        const resId = `r${resolutionCounter++}`;

        resolutions[resId] = {
          title: branchData.solution.title,
          steps: branchData.solution.steps,
        };

        nodes[nodeId].branches[branch] = {
          resolution: resId,
        };
      } else if (branchData.type === "QUESTION") {
        const nextNodeId = traverse(branchData.nextQuestionId);

        nodes[nodeId].branches[branch] = {
          next: nextNodeId,
        };
      }
    });

    return nodeId;
  };

  const startNode = traverse(draft.rootQuestionId);

  return {
    errorId: draft.errorId,
    name: draft.name,
    description: draft.description,
    startNode,
    nodes,
    resolutions,
  };
};

const buildTreeStatus = (draft, questionId, depth = 0) => {
  const q = draft.questions.find((q) => q.id === questionId);
  if (!q) return [];

  const rows = [];

  ["YES", "NO"].forEach((branch) => {
    const branchData = q[branch];
    let status = "⏳";

    if (
      branchData.type === "SOLUTION" &&
      branchData.solution.title &&
      branchData.solution.steps.length > 0
    ) {
      status = "✔";
    }

    rows.push({
      label: `${" ".repeat(depth * 2)}${branch}`,
      status,
      questionId: q.id,
      branch,
    });

    if (branchData.type === "QUESTION" && branchData.nextQuestionId) {
      rows.push(
        ...buildTreeStatus(draft, branchData.nextQuestionId, depth + 1),
      );
    }
  });

  return rows;
};

const buildTreePreview = (draft, questionId, depth = 0) => {
  const q = draft.questions.find((q) => q.id === questionId);
  if (!q) return null;

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div>
        <strong>Q:</strong> {q.text}
      </div>

      {["YES", "NO"].map((branch) => {
        const b = q[branch];

        if (b.type === "SOLUTION") {
          return (
            <div key={branch} style={{ marginLeft: 20 }}>
              <strong>{branch} → Solution:</strong> {b.solution.title}
              <ul>
                {b.solution.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <div key={branch} style={{ marginLeft: 20 }}>
            <strong>{branch} →</strong>
            {buildTreePreview(draft, b.nextQuestionId, depth + 1)}
          </div>
        );
      })}
    </div>
  );
};

/* =======================
   ADMIN COMPONENT
   ======================= */

export default function Admin() {
  const [mode, setMode] = useState("VIEW"); // VIEW | CREATE
  const [errors, setErrors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pathStack, setPathStack] = useState([]);
  const [stepInput, setStepInput] = useState("");
  const [createMode, setCreateMode] = useState("FORM");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [parsedJson, setParsedJson] = useState(null);

  const [draft, setDraft] = useState({
    name: "",
    errorId: "",
    description: "",
    rootQuestionId: "q1",
    questions: [
      {
        id: "q1",
        text: "",
        YES: {
          type: null,
          solution: { title: "", steps: [] },
          nextQuestionId: null,
        },
        NO: {
          type: null,
          solution: { title: "", steps: [] },
          nextQuestionId: null,
        },
      },
    ],
  });

  const [activeQuestionId, setActiveQuestionId] = useState("q1");
  const [activeBranch, setActiveBranch] = useState(null); // YES | NO | null
  const [step, setStep] = useState(1);

  const currentQuestion = draft.questions.find(
    (q) => q.id === activeQuestionId,
  );

  useEffect(() => {
    if (mode === "VIEW") {
      getErrors().then(setErrors);
    }
  }, [mode]);

  const validateErrorJson = (obj) => {
    const requiredKeys = [
      "errorId",
      "name",
      "startNode",
      "nodes",
      "resolutions",
    ];

    for (const key of requiredKeys) {
      if (!(key in obj)) {
        return `Missing required key: ${key}`;
      }
    }

    if (typeof obj.nodes !== "object") {
      return "nodes must be an object";
    }

    if (typeof obj.resolutions !== "object") {
      return "resolutions must be an object";
    }

    return null;
  };

  const goBack = () => {
    setPathStack((prev) => {
      if (prev.length === 0) return prev;

      const updated = [...prev];
      const last = updated.pop();

      setActiveQuestionId(last.questionId);
      setActiveBranch(null);
      setStep(4); // branch selection screen

      return updated;
    });
  };

  const handleDelete = async (errorId) => {
    const confirm = window.confirm(
      `Are you sure you want to delete ${errorId}? This cannot be undone.`,
    );

    if (!confirm) return;

    await deleteError(errorId);

    setSelected(null);
    getErrors().then(setErrors);
  };

  const generateErrorId = (name) =>
    "ERR_" +
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

  const saveError = async () => {
    try {
      const payload = buildErrorJson(draft);

      await axios.post("http://localhost:8000/api/errors", payload, {
        headers: {
          "x-admin-key": "super-secret-admin-key",
        },
      });

      // ✅ RESET STATE + GO BACK TO ADMIN HOME
      setMode("VIEW");
      setSelected(null);
      setStep(1);
      setActiveBranch(null);
      setActiveQuestionId(draft.rootQuestionId);
      setPathStack([]);

      // reload errors list
      getErrors().then(setErrors);

      alert("Error saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save error. Check backend logs.");
    }
  };

  const createNextQuestion = (branch) => {
    const newId = `q${draft.questions.length + 1}`;

    setDraft((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: newId,
          text: "",
          YES: {
            type: null,
            solution: { title: "", steps: [] },
            nextQuestionId: null,
          },
          NO: {
            type: null,
            solution: { title: "", steps: [] },
            nextQuestionId: null,
          },
        },
      ].map((q) =>
        q.id === currentQuestion.id
          ? {
              ...q,
              [branch]: {
                ...q[branch],
                nextQuestionId: newId,
              },
            }
          : q,
      ),
    }));

    setPathStack((prev) => [
      ...prev,
      { questionId: currentQuestion.id, branch },
    ]);

    setActiveQuestionId(newId);
    setActiveBranch(null);
    setStep(2);
  };

  /* =======================
     CREATE MODE UI
     ======================= */

  if (mode === "CREATE") {
    return (
      <div>
        <h2>Create New Error</h2>
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="radio"
              checked={createMode === "FORM"}
              onChange={() => setCreateMode("FORM")}
            />
            Use Form Builder
          </label>

          <label style={{ marginLeft: "15px" }}>
            <input
              type="radio"
              checked={createMode === "JSON"}
              onChange={() => setCreateMode("JSON")}
            />
            Paste JSON
          </label>
        </div>
        {pathStack.length > 0 && <button onClick={goBack}>← Go Back</button>}
        {pathStack.length > 0 && (
          <div style={{ marginBottom: "10px", fontSize: "14px" }}>
            Path: Root{pathStack.map((p) => ` → ${p.branch}`)}
          </div>
        )}
        <button onClick={() => setMode("VIEW")}>Cancel</button>

        {createMode === "FORM" && (
          <div
            style={{
              margin: "20px 0",
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <strong>Progress</strong>

            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {buildTreeStatus(draft, draft.rootQuestionId).map((row, idx) => (
                <li
                  key={idx}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setActiveQuestionId(row.questionId);
                    setActiveBranch(row.branch);
                    setStep(4);
                  }}
                >
                  {row.label} → {row.status}
                </li>
              ))}
            </ul>
          </div>
        )}

        {createMode === "JSON" && (
          <div>
            <textarea
              rows={15}
              placeholder="Paste error JSON here"
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError(null);
                setParsedJson(null);
              }}
              style={{ width: "100%" }}
            />

            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(jsonInput);
                  const error = validateErrorJson(parsed);

                  if (error) {
                    setJsonError(error);
                    return;
                  }

                  setParsedJson(parsed);
                  alert("JSON is valid");
                } catch {
                  setJsonError("Invalid JSON format");
                }
              }}
            >
              Validate JSON
            </button>

            {jsonError && <div style={{ color: "red" }}>{jsonError}</div>}

            <button
              disabled={!parsedJson}
              onClick={async () => {
                try {
                  await axios.post(
                    "http://localhost:8000/api/errors",
                    parsedJson,
                    {
                      headers: {
                        "x-admin-key": "super-secret-admin-key",
                      },
                    },
                  );

                  alert("Error created successfully");
                  setMode("VIEW");
                } catch {
                  alert("Failed to create error");
                }
              }}
            >
              Create Error
            </button>
          </div>
        )}

        {/* STEP 1 */}
        {createMode === "FORM" && (
          <>
            {step === 1 && (
              <div>
                <h4>Error Basics</h4>
                <input
                  placeholder="Error Name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                      errorId: generateErrorId(e.target.value),
                    }))
                  }
                />
                <input
                  placeholder="Error ID"
                  value={draft.errorId}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      errorId: e.target.value,
                    }))
                  }
                />
                <textarea
                  placeholder="Description"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
                <button disabled={!draft.name} onClick={() => setStep(2)}>
                  Next
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div>
                <h4>Question</h4>

                <input
                  placeholder="Question text"
                  value={currentQuestion.text}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      questions: prev.questions.map((q) =>
                        q.id === currentQuestion.id
                          ? { ...q, text: e.target.value }
                          : q,
                      ),
                    }))
                  }
                />

                <div style={{ marginTop: "10px" }}>
                  <strong>If YES:</strong>
                  <label>
                    <input
                      type="radio"
                      checked={currentQuestion.YES.type === "QUESTION"}
                      onChange={() =>
                        setDraft((prev) => ({
                          ...prev,
                          questions: prev.questions.map((q) =>
                            q.id === currentQuestion.id
                              ? {
                                  ...q,
                                  YES: { ...q.YES, type: "QUESTION" },
                                }
                              : q,
                          ),
                        }))
                      }
                    />
                    Ask another question
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={currentQuestion.YES.type === "SOLUTION"}
                      onChange={() =>
                        setDraft((prev) => ({
                          ...prev,
                          questions: prev.questions.map((q) =>
                            q.id === currentQuestion.id
                              ? {
                                  ...q,
                                  YES: { ...q.YES, type: "SOLUTION" },
                                }
                              : q,
                          ),
                        }))
                      }
                    />
                    Show solution
                  </label>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <strong>If NO:</strong>
                  <label>
                    <input
                      type="radio"
                      checked={currentQuestion.NO.type === "QUESTION"}
                      onChange={() =>
                        setDraft((prev) => ({
                          ...prev,
                          questions: prev.questions.map((q) =>
                            q.id === currentQuestion.id
                              ? {
                                  ...q,
                                  NO: { ...q.NO, type: "QUESTION" },
                                }
                              : q,
                          ),
                        }))
                      }
                    />
                    Ask another question
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={currentQuestion.NO.type === "SOLUTION"}
                      onChange={() =>
                        setDraft((prev) => ({
                          ...prev,
                          questions: prev.questions.map((q) =>
                            q.id === currentQuestion.id
                              ? {
                                  ...q,
                                  NO: { ...q.NO, type: "SOLUTION" },
                                }
                              : q,
                          ),
                        }))
                      }
                    />
                    Show solution
                  </label>
                </div>

                <button
                  disabled={
                    !currentQuestion.text ||
                    !currentQuestion.YES.type ||
                    !currentQuestion.NO.type
                  }
                  onClick={() => setStep(4)}
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div>
                <h4>Select branch to complete</h4>
                {["YES", "NO"].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setActiveBranch(b);
                      if (currentQuestion[b].type === "QUESTION") {
                        createNextQuestion(b);
                      } else {
                        setStep(5);
                      }
                    }}
                  >
                    {b} path
                  </button>
                ))}
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && activeBranch && (
              <div>
                <h4>{activeBranch} → Solution</h4>
                <input
                  placeholder="Solution title"
                  value={currentQuestion[activeBranch].solution.title}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      questions: prev.questions.map((q) =>
                        q.id === currentQuestion.id
                          ? {
                              ...q,
                              [activeBranch]: {
                                ...q[activeBranch],
                                solution: {
                                  ...q[activeBranch].solution,
                                  title: e.target.value,
                                },
                              },
                            }
                          : q,
                      ),
                    }))
                  }
                />
                <input
                  placeholder="Add solution step"
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                />

                <button
                  disabled={!stepInput.trim()}
                  onClick={() => {
                    setDraft((prev) => ({
                      ...prev,
                      questions: prev.questions.map((q) =>
                        q.id === currentQuestion.id
                          ? {
                              ...q,
                              [activeBranch]: {
                                ...q[activeBranch],
                                solution: {
                                  ...q[activeBranch].solution,
                                  steps: [
                                    ...q[activeBranch].solution.steps,
                                    stepInput.trim(),
                                  ],
                                },
                              },
                            }
                          : q,
                      ),
                    }));
                    setStepInput("");
                  }}
                >
                  Add Step
                </button>
                <ul>
                  {currentQuestion[activeBranch].solution.steps.map(
                    (step, idx) => (
                      <li key={idx}>{step}</li>
                    ),
                  )}
                </ul>

                <button onClick={() => setStep(6)}>Preview</button>
              </div>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <div>
                <h4>Preview</h4>

                <div style={{ padding: "10px", border: "1px solid #ccc" }}>
                  {buildTreePreview(draft, draft.rootQuestionId)}
                </div>

                <button onClick={() => setStep(4)}>← Back</button>

                <button onClick={saveError}>Save Error</button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* =======================
     VIEW MODE
     ======================= */

  return (
    <div>
      <h2>Admin – Error Registry</h2>
      <button onClick={() => setMode("CREATE")}>Create New Error</button>
      <button onClick={() => (window.location.href = "/")}>Go Home</button>

      <ul>
        {errors.map((err) => (
          <li key={err.errorId}>
            <button
              onClick={async () => {
                const data = await getErrorById(err.errorId);
                setSelected(data);
              }}
            >
              {err.errorId}
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div>
          <pre>{JSON.stringify(selected, null, 2)}</pre>

          <button
            style={{ color: "red", marginTop: "10px" }}
            onClick={() => handleDelete(selected.errorId)}
          >
            Delete Error
          </button>
        </div>
      )}
    </div>
  );
}
