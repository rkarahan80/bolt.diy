import React, { useState, useEffect } from 'react';
import { Markdown } from '~/components/chat/Markdown'; // Assuming this path is correct

const ProjectPlanDisplay: React.FC = () => {
  const [planContent, setPlanContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // In WebContainer, files are served over HTTP.
        // The '/project-plan.md' path assumes it's at the root of the served directory.
        const response = await fetch('/project-plan.md');
        if (response.ok) {
          const text = await response.text();
          setPlanContent(text);
        } else if (response.status === 404) {
          setPlanContent(null); // Or a specific message like "Project plan not found."
        } else {
          setError(`Error fetching project plan: ${response.status} ${response.statusText}`);
          setPlanContent(null);
        }
      } catch (e: any) {
        console.error('Failed to fetch project plan:', e);
        setError(`Failed to fetch project plan: ${e.message}`);
        setPlanContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, []);

  if (isLoading) {
    return <div>Loading project plan...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!planContent) {
    return <div>No project plan found.</div>;
  }

  return (
    <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
      <Markdown content={planContent} />
    </div>
  );
};

export default ProjectPlanDisplay;
