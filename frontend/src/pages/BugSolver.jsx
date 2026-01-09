import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBugById,
  saveProgress,
  resolveBug
} from "../api/bugs";
import { getErrorById } from "../api/errors";

export default function BugSolver() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bugData, setBugData] = useState(null);
  const [errorConfig, setErrorConfig] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [answer, setAnswer] = useState("");

  const load = async () => {
    const data = await getBugById(id);
    setBugData(data);

    const config = await getErrorById(data.bug.errorType);
    setErrorConfig(config);

    if (data.progress.length === 0) {
      setCurrentNodeId(config.startNode);
    } else {
      const last = data.progress[data.progress.length - 1];
      const node = config.nodes[last.nodeId];
      const branch = node.branches[last.answer];
      setCurrentNodeId(branch?.next || null);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!bugData || !errorConfig) return <div>Loading...</div>;

  const { bug, progress, resolution } = bugData;

  if (resolution) {
    const res =
      errorConfig.resolutions[resolution.resolutionId];

    return (
      <div>
        <h2>{errorConfig.name}</h2>
        <p>Status: RESOLVED</p>

        <h3>{res.title}</h3>
        <ul>
          {res.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        <h4>Verified Reasons</h4>
        <ul>
          {progress.map(p => (
            <li key={p._id}>
              {errorConfig.nodes[p.nodeId].question} → {p.answer}
            </li>
          ))}
        </ul>

        <button onClick={() => navigate("/")}>
          Back to Home
        </button>

        <button
          onClick={() =>
            navigate(`/start/${bug.errorType}`)
          }
        >
          Try Another Path
        </button>
      </div>
    );
  }

  const node = currentNodeId
    ? errorConfig.nodes[currentNodeId]
    : null;

  const submitAnswer = async () => {
    await saveProgress(id, {
      nodeId: currentNodeId,
      answer
    });

    const branch = node.branches[answer];
    if (branch.resolution) {
      await resolveBug(id, {
        resolutionId: branch.resolution
      });
    }

    setAnswer("");
    load();
  };

  return (
    <div>
      <h2>{errorConfig.name}</h2>
      <p>Status: OPEN</p>

      <button
        onClick={() =>
          navigate(`/start/${bug.errorType}`)
        }
      >
        Restart Investigation
      </button>

      {progress.length > 0 && (
        <div>
          <h4>Checked</h4>
          <ul>
            {progress.map(p => (
              <li key={p._id}>
                {errorConfig.nodes[p.nodeId].question} → {p.answer}
              </li>
            ))}
          </ul>
        </div>
      )}

      {node && (
        <div>
          <p>{node.question}</p>
          <button onClick={() => setAnswer("YES")}>YES</button>
          <button onClick={() => setAnswer("NO")}>NO</button>
          <button disabled={!answer} onClick={submitAnswer}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
