"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { useState } from "react";

export default function ProjectSidebar() {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    createProject,
  } = useProjectStore();
  
  

  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [addCollaboratorMessage, setAddCollaboratorMessage] = useState("");
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    const success = await createProject(newProjectName.trim());
    if (success) {
      setNewProjectName("");
    }
    setIsCreating(false);
  };

  const handleAddCollaborator = async () => {
    if (!collaboratorEmail.trim() || !activeProjectId) {
      setAddCollaboratorMessage("Please enter an email and select a project.");
      return;
    }
    setIsAddingCollaborator(true);
    setAddCollaboratorMessage(""); // Clear previous messages

    try {
      const response = await fetch(`/api/projects/${activeProjectId}/add-collaborator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: collaboratorEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setAddCollaboratorMessage(data.message || "Collaborator added successfully!");
        setCollaboratorEmail(""); // Clear input on success
      } else {
        // Handle specific error messages from the API
        if (response.status === 404) {
          setAddCollaboratorMessage("Collaborator user not found. Please ensure they have signed up.");
        } else if (response.status === 409) {
          setAddCollaboratorMessage("User is already a collaborator on this project.");
        } else if (data.message) {
          setAddCollaboratorMessage(`Error: ${data.message}`);
        } else {
          setAddCollaboratorMessage(`Error: ${response.statusText || "Something went wrong."}`);
        }
      }
    } catch (error) {
      console.error("Failed to add collaborator:", error);
      setAddCollaboratorMessage("Failed to add collaborator. Please try again.");
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-64 bg-gray-800 text-white p-4 z-50 flex flex-col">
      <h2 className="text-lg font-bold mb-4">Projects</h2>
      <div className="flex-1 overflow-y-auto">
        <ul>
          {projects.map((project) => (
            <li key={project.id} className="mb-2">
              <button
                onClick={() => setActiveProject(project.id)}
                className={`w-full text-left px-2 py-1 rounded ${
                  project.id === activeProjectId
                    ? "bg-blue-500"
                    : "hover:bg-gray-700"
                }`}
              >
                {project.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 border-t border-gray-700 pt-4">
        <h3 className="text-md font-bold mb-2">Create New Project</h3>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name..."
          className="w-full px-2 py-1 rounded bg-gray-700 text-white mb-2"
        />
        <button
          onClick={handleCreateProject}
          disabled={isCreating || !newProjectName.trim()}
          className="w-full px-2 py-1 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
        >
          {isCreating ? "Creating..." : "Create Project"}
        </button>
      </div>

      {activeProjectId && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <h3 className="text-md font-bold mb-2">Add Collaborator to Current Project</h3>
          <input
            type="email"
            value={collaboratorEmail}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
            placeholder="Collaborator's email..."
            className="w-full px-2 py-1 rounded bg-gray-700 text-white mb-2"
          />
          <button
            onClick={handleAddCollaborator}
            disabled={isAddingCollaborator || !collaboratorEmail.trim()}
            className="w-full px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
          >
            {isAddingCollaborator ? "Adding..." : "Add Collaborator"}
          </button>
          {addCollaboratorMessage && (
            <p className="mt-2 text-sm" style={{ color: addCollaboratorMessage.includes("Error") || addCollaboratorMessage.includes("not found") || addCollaboratorMessage.includes("already") ? "red" : "lightgreen" }}>
              {addCollaboratorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}