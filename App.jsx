import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("0");
  const [output, setOutput] = useState("Output will appear here...");
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);

  const languages = [
    { name: "Python", id: "0" },
    { name: "JavaScript", id: "4" },
    { name: "C", id: "7" },
    { name: "C++", id: "77" },
    { name: "Java", id: "8" },
  ];

  // Clear interval when component is removed
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // Fetch result using codeId
  async function fetchResult(codeId) {
  try {
    const response = await fetch(
      `/api/codeResult/${codeId}`
    );

    const result = await response.json();

    console.log("GET Response:", result);

    if (
      result.data &&
      Object.keys(result.data).length > 0
    ) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;

      if (result.data.errors && result.data.errors.trim()) {
        setOutput(result.data.errors);
      } else {
        setOutput(result.data.output || "Execution completed.");
      }

      setLoading(false);
    }

  } catch (error) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;

    setOutput("Error fetching result: " + error.message);
    setLoading(false);
  }
}

  // Submit code to server
  async function compileCode() {
  if (!code.trim()) {
    setOutput("Please write some code first!");
    return;
  }

  clearInterval(intervalRef.current);
  intervalRef.current = null;

  setLoading(true);
  setOutput("Submitting code...");

  try {
    const response = await fetch(
      "/api/executeCode",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          code: code,
          langId: language
        })
      }
    );

    // Read the server response
    const result = await response.json();

    console.log("POST Response:", result);

    if (!response.ok) {
      throw new Error(
        result.error || `Server error: ${response.status}`
      );
    }

    if (result.error) {
      setOutput(result.error);
      setLoading(false);
      return;
    }

    if (result.codeId) {
      setOutput("Code submitted! Waiting for compilation...");

      intervalRef.current = setInterval(() => {
        fetchResult(result.codeId);
      }, 2000);
    } else {
      setOutput("Invalid response received from server.");
      setLoading(false);
    }

  } catch (error) {
    console.error("Compilation Error:", error);
    setOutput("Error: " + error.message);
    setLoading(false);
  }
}

  return (
    <div className="container">
      <h1>Online Code Compiler</h1>

      <div className="toolbar">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>

        <button onClick={compileCode} disabled={loading}>
          {loading ? "Compiling..." : "Compile & Run"}
        </button>
      </div>

      <h3>Code Editor</h3>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
        spellCheck="false"
      />

      <h3>Output Console</h3>

      <div className="output">
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default App;