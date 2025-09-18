// bookmarklet.js
(function() {
  if (document.getElementById("bookmarklet-gui")) return;

  // --- GUI container ---
  const gui = document.createElement("div");
  gui.id = "bookmarklet-gui";
  Object.assign(gui.style, {
    position: "fixed",
    top: "80px",
    left: "80px",
    background: "black",
    color: "red",
    padding: "50px",
    border: "6px solid red",
    borderRadius: "30px",
    fontSize: "32px",
    zIndex: "9999",
    fontFamily: "Arial, sans-serif",
    minWidth: "500px",
    textAlign: "center",
    boxShadow: "0px 0px 40px rgba(255,0,0,0.9)",
    cursor: "move"
  });

  // --- Make draggable ---
  gui.onmousedown = function(e) {
    const shiftX = e.clientX - gui.getBoundingClientRect().left;
    const shiftY = e.clientY - gui.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
      gui.style.left = pageX - shiftX + "px";
      gui.style.top = pageY - shiftY + "px";
    }

    function onMouseMove(e) {
      moveAt(e.pageX, e.pageY);
    }

    document.addEventListener("mousemove", onMouseMove);

    gui.onmouseup = function() {
      document.removeEventListener("mousemove", onMouseMove);
      gui.onmouseup = null;
    };
  };
  gui.ondragstart = () => false;

  // --- Title ---
  const title = document.createElement("div");
  title.textContent = "Bookmarklet GUI";
  Object.assign(title.style, { fontSize: "40px", marginBottom: "40px", fontWeight: "bold" });
  gui.appendChild(title);

  // --- Button creator ---
  function makeButton(label, action) {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      background: "black",
      color: "red",
      border: "3px solid red",
      borderRadius: "15px",
      padding: "20px 40px",
      cursor: "pointer",
      fontSize: "28px",
      margin: "15px"
    });
    btn.onmouseover = () => { btn.style.background = "red"; btn.style.color = "black"; };
    btn.onmouseout = () => { btn.style.background = "black"; btn.style.color = "red"; };
    btn.onclick = action;
    return btn;
  }

  // --- Button 1: Skip video & auto-answer ---
  gui.appendChild(makeButton("Skip Video & Auto Answer", async () => {
    async function get_attempt() {
      const res = await fetch(location.href + "/attempts"); // adjust if needed
      return await res.json();
    }

    async function construct_headers() {
      return { "Content-Type": "application/json" };
    }

    async function skip_video(attempt) {
      const id = attempt._id || attempt.id;
      const url = `https://edpuzzle.com/api/v4/media_attempts/${id}/watch`;
      await fetch(url, { method: "POST", headers: await construct_headers(), body: JSON.stringify({ timeIntervalNumber: 10 }) });
      console.log("Video skipped!");
    }

    async function post_answers(attempt, questions) {
      const filtered = questions.filter(q => q.type === "multiple-choice");
      const id = attempt._id || attempt.id;
      const content = { answers: [] };

      filtered.forEach(q => {
        const correct = q.choices.filter(c => c.isCorrect).map(c => c._id);
        content.answers.push({ questionId: q._id, choices: correct, type: "multiple-choice" });
      });

      const url = `https://edpuzzle.com/api/v3/attempts/${id}/answers`;
      await fetch(url, { method: "POST", headers: await construct_headers(), body: JSON.stringify(content) });
      console.log("Answers submitted!");
    }

    try {
      const attempt = await get_attempt();
      await skip_video(attempt);

      const questions = window.questions || []; // make sure questions are loaded
      await post_answers(attempt, questions);

      alert("Video skipped and answers submitted!");
      location.reload();
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Check console.");
    }
  }));

  // --- Close button ---
  const closeBtn = document.createElement("div");
  closeBtn.textContent = "✖";
  Object.assign(closeBtn.style, { position: "absolute", top: "15px", right: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "28px" });
  closeBtn.onclick = () => gui.remove();
  gui.appendChild(closeBtn);

  document.body.appendChild(gui);
})();
