// ============================================================
// RÜDIGER WIRD 61 — App-Logik
// ============================================================

// ---------- Kleine Helfer ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Verkleinert/komprimiert ein Bild im Browser zu einem JPEG-Data-URL, damit
// es als Textfeld in ein Firestore-Dokument passt (Limit: 1 MiB pro
// Dokument). Reduziert Größe/Qualität schrittweise, bis es passt.
async function compressImageToDataUrl(file, maxBytes = 700000) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const attempts = [
    { maxDim: 1400, quality: 0.75 },
    { maxDim: 1100, quality: 0.7 },
    { maxDim: 900, quality: 0.6 },
    { maxDim: 700, quality: 0.5 },
    { maxDim: 500, quality: 0.45 },
  ];

  for (const { maxDim, quality } of attempts) {
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round(height * (maxDim / width));
        width = maxDim;
      } else {
        width = Math.round(width * (maxDim / height));
        height = maxDim;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length <= maxBytes) return out;
  }
  throw new Error("Bild konnte nicht klein genug komprimiert werden.");
}

function formatTimestamp(ts) {
  if (!ts) return "";
  const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// 1) PASSWORT-SCHRANKE
// ============================================================

const SITE_PASSWORD = window.RUEDIGER_SITE_PASSWORD || "";
const SESSION_KEY = "ruediger61_unlocked";

const passwordGate = document.getElementById("password-gate");
const passwordForm = document.getElementById("password-form");
const passwordInput = document.getElementById("password-input");
const passwordError = document.getElementById("password-error");
const welcomePopup = document.getElementById("welcome-popup");
const popupContinueBtn = document.getElementById("popup-continue");
const mainSite = document.getElementById("main-site");

function unlockSite() {
  passwordGate.classList.add("hidden");
  sessionStorage.setItem(SESSION_KEY, "1");
  showWelcomePopup();
}

function showWelcomePopup() {
  welcomePopup.classList.remove("hidden");
  const dismiss = () => closeWelcomePopup();
  popupContinueBtn.addEventListener("click", dismiss, { once: true });
  window._popupAutoTimer = setTimeout(dismiss, 7000);
}

function closeWelcomePopup() {
  clearTimeout(window._popupAutoTimer);
  welcomePopup.classList.add("closing");
  setTimeout(() => {
    welcomePopup.classList.add("hidden");
    welcomePopup.classList.remove("closing");
    mainSite.classList.remove("hidden");
  }, 550);
}

passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (passwordInput.value === SITE_PASSWORD) {
    passwordError.classList.add("hidden");
    unlockSite();
  } else {
    passwordError.classList.remove("hidden");
    passwordInput.value = "";
    passwordInput.focus();
  }
});

if (sessionStorage.getItem(SESSION_KEY) === "1") {
  passwordGate.classList.add("hidden");
  mainSite.classList.remove("hidden");
  // Popup nur beim allerersten Eintreten zeigen, nicht bei jedem Reload.
}

// ============================================================
// 2) FIREBASE (Gästebuch + Fotos)
// ============================================================

const config = window.RUEDIGER_FIREBASE_CONFIG || {};
const firebaseConfigured = config.apiKey && config.apiKey !== "DEIN_API_KEY";

const guestbookForm = document.getElementById("guestbook-form");
const guestbookStatus = document.getElementById("guestbook-status");
const guestbookList = document.getElementById("guestbook-list");

const photoForm = document.getElementById("photo-form");
const photoStatus = document.getElementById("photo-status");
const photoGallery = document.getElementById("photo-gallery");
const photoInput = document.getElementById("photo-input");
const fileDropText = document.getElementById("file-drop-text");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");

lightboxClose.addEventListener("click", () => lightbox.classList.add("hidden"));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.classList.add("hidden");
});

photoInput.addEventListener("change", () => {
  const n = photoInput.files.length;
  fileDropText.textContent = n
    ? `${n} Foto${n > 1 ? "s" : ""} ausgewählt`
    : "Fotos auswählen oder hierher ziehen";
});

function setStatus(el, message, type) {
  el.textContent = message;
  el.classList.remove("hidden", "ok", "err");
  el.classList.add(type);
}

if (!firebaseConfigured) {
  setStatus(
    guestbookStatus,
    "Firebase ist noch nicht eingerichtet — Grüße können daher noch nicht gespeichert werden. Siehe README.md.",
    "err"
  );
  setStatus(
    photoStatus,
    "Firebase ist noch nicht eingerichtet — Fotos können daher noch nicht hochgeladen werden. Siehe README.md.",
    "err"
  );
  guestbookForm.querySelector("button").disabled = true;
  photoForm.querySelector("button").disabled = true;
} else {
  initFirebase();
}

async function initFirebase() {
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"
  );
  const {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
  } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  const app = initializeApp(config);
  const db = getFirestore(app);

  // ---------- Gästebuch ----------

  const guestbookCol = collection(db, "guestbook");
  const guestbookQuery = query(guestbookCol, orderBy("timestamp", "desc"));

  onSnapshot(
    guestbookQuery,
    (snapshot) => {
      if (snapshot.empty) {
        guestbookList.innerHTML =
          '<p class="empty-note">Sei der/die Erste, die einen Gruß hinterlässt!</p>';
        return;
      }
      guestbookList.innerHTML = snapshot.docs
        .map((doc) => {
          const d = doc.data();
          return `
            <div class="guest-entry">
              <p class="guest-name">${escapeHtml(d.name)}</p>
              <p class="guest-message">${escapeHtml(d.message)}</p>
              <span class="guest-time">${formatTimestamp(d.timestamp)}</span>
            </div>`;
        })
        .join("");
    },
    (err) => {
      console.error("Gästebuch konnte nicht geladen werden:", err);
    }
  );

  guestbookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("guest-name").value.trim();
    const message = document.getElementById("guest-message").value.trim();
    if (!name || !message) return;

    const btn = guestbookForm.querySelector("button");
    btn.disabled = true;
    try {
      await addDoc(guestbookCol, {
        name,
        message,
        timestamp: serverTimestamp(),
      });
      guestbookForm.reset();
      setStatus(guestbookStatus, "Danke für deinen Gruß! 🥂", "ok");
    } catch (err) {
      console.error(err);
      setStatus(
        guestbookStatus,
        "Ups, das hat nicht geklappt. Bitte versuche es erneut.",
        "err"
      );
    } finally {
      btn.disabled = false;
      setTimeout(() => guestbookStatus.classList.add("hidden"), 4000);
    }
  });

  // ---------- Fotos ----------

  const photosCol = collection(db, "photos");
  const photosQuery = query(photosCol, orderBy("timestamp", "desc"));

  onSnapshot(
    photosQuery,
    (snapshot) => {
      if (snapshot.empty) {
        photoGallery.innerHTML =
          '<p class="empty-note">Noch keine Fotos — lade das erste hoch!</p>';
        return;
      }
      photoGallery.innerHTML = "";
      snapshot.docs.forEach((doc) => {
        const d = doc.data();
        const img = document.createElement("img");
        img.src = d.url;
        img.alt = d.name ? `Foto von ${d.name}` : "Foto von der Feier";
        img.loading = "lazy";
        img.addEventListener("click", () => {
          lightboxImage.src = d.url;
          lightbox.classList.remove("hidden");
        });
        photoGallery.appendChild(img);
      });
    },
    (err) => {
      console.error("Fotos konnten nicht geladen werden:", err);
    }
  );

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB Original, wird vor dem Speichern verkleinert

  photoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const files = Array.from(photoInput.files);
    if (!files.length) {
      setStatus(photoStatus, "Bitte wähle mindestens ein Foto aus.", "err");
      return;
    }

    const uploaderName = document.getElementById("photo-name").value.trim();
    const btn = photoForm.querySelector("button");
    btn.disabled = true;
    setStatus(photoStatus, "Fotos werden verarbeitet …", "ok");

    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        failed++;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        failed++;
        continue;
      }

      try {
        const dataUrl = await compressImageToDataUrl(file);
        await addDoc(photosCol, {
          url: dataUrl,
          name: uploaderName || null,
          timestamp: serverTimestamp(),
        });
        uploaded++;
      } catch (err) {
        console.error("Foto konnte nicht gespeichert werden:", err);
        failed++;
      }
    }

    btn.disabled = false;
    photoForm.reset();
    fileDropText.textContent = "Fotos auswählen oder hierher ziehen";

    if (uploaded && !failed) {
      setStatus(photoStatus, `${uploaded} Foto(s) erfolgreich hochgeladen! 📸`, "ok");
    } else if (uploaded && failed) {
      setStatus(
        photoStatus,
        `${uploaded} Foto(s) hochgeladen, ${failed} fehlgeschlagen (zu groß oder kein Bild).`,
        "err"
      );
    } else {
      setStatus(photoStatus, "Upload fehlgeschlagen. Bitte versuche es erneut.", "err");
    }
    setTimeout(() => photoStatus.classList.add("hidden"), 5000);
  });
}
