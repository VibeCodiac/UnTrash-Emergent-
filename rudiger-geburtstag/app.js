// ============================================================
// RÜDIGER WIRD 61 — App-Logik
// ============================================================

// ---------- Kleine Helfer ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
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
const uploadProgressWrap = document.getElementById("upload-progress");
const uploadProgressBar = document.getElementById("upload-progress-bar");

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
  const {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
  } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js"
  );

  const app = initializeApp(config);
  const db = getFirestore(app);
  const storage = getStorage(app);

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

  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB

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
    uploadProgressWrap.classList.remove("hidden");

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

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `photos/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}-${safeName}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);

      try {
        await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
              uploadProgressBar.style.width = `${pct}%`;
            },
            reject,
            resolve
          );
        });
        const url = await getDownloadURL(storageRef);
        await addDoc(photosCol, {
          url,
          storagePath: path,
          name: uploaderName || null,
          timestamp: serverTimestamp(),
        });
        uploaded++;
      } catch (err) {
        console.error("Upload fehlgeschlagen:", err);
        failed++;
      }
    }

    btn.disabled = false;
    uploadProgressWrap.classList.add("hidden");
    uploadProgressBar.style.width = "0%";
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
