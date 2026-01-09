import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createBug } from "../api/bugs";

export default function StartInvestigation() {
  const { errorId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function start() {
      const bug = await createBug({
        errorType: errorId
      });

      navigate(`/bug/${bug._id}`);
    }

    start();
  }, [errorId, navigate]);

  return <div>Starting investigation...</div>;
}
