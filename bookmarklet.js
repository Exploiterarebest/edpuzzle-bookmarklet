javascript:(async function() {
  if (document.getElementById("bookmarklet-gui")) return;

  // --- GUI container ---
  let gui = document.createElement("div");
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
    let shiftX = e.clientX - gui.getBoundingClientRect().left;
    let shiftY = e.clientY - gui.getBoundingClientRect().top;

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
  let title = document.createElement("div");
  title.textContent = "Bookmarklet GUI";
  Object.assign(title.style, { fontSize: "40px", marginBottom: "40px", fontWeight: "bold" });
  gui.appendChild(title);

  // --- Button creator ---
  function makeButton(label, action) {
    let btn = document.createElement("button");
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

  // --- Button 1: Skip video & auto answer ---
  gui.appendChild(makeButton("Skip Video & Auto Answer", async () => {
    try {
      const token = window.localStorage.getItem('edpuzzleToken'); // grab your token from localStorage
      if (!token) { alert("Cannot find token, make sure you are logged in."); return; }

      // --- Get current attempt ---
      const attemptRes = await fetch('https://edpuzzle.com/api/v4/media_attempts?include_attempts=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const attempts = await attemptRes.json();
      if (!attempts.length) { alert("No attempt found."); return; }
      const attempt = attempts[0];

      // --- Skip video ---
      await fetch(`https://edpuzzle.com/api/v4/media_attempts/${attempt.id}/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timeIntervalNumber: 10 })
      });
      console.log("Video skipped!");

      // --- Auto answer ---
      const questions = window.questions || [];
      const answers = [];
      for (let q of questions) {
        if (q.type === "multiple-choice") {
          const correctIds = q.choices.filter(c => c.isCorrect).map(c => c._id);
          answers.push({ questionId: q._id, choices: correctIds, type: "multiple-choice" });
        }
      }

      if (answers.length) {
        await fetch(`https://edpuzzle.com/api/v3/attempts/${attempt.id}/answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ answers })
        });
        console.log("Answers submitted!");
      }

      alert("Video skipped and answers submitted!");
      location.reload();
    } catch(e) {
      console.error(e);
      alert("Something went wrong, check console.");
    }
  }));

  // --- Close button ---
  let closeBtn = document.createElement("div");
  closeBtn.textContent = "✖";
  Object.assign(closeBtn.style, { position: "absolute", top: "15px", right: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "28px" });
  closeBtn.onclick = () => gui.remove();
  gui.appendChild(closeBtn);

  document.body.appendChild(gui);
})();
