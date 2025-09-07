import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
const room = new WebsimSocket();
function useCurrentUser() {
  const [u, setU] = useState(null);
  useEffect(() => {
    (async () => setU(await window.websim.getCurrentUser()))();
  }, []);
  return u;
}
function Header({ query, setQuery, onOpenUpload, onOpenProfile }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "head container", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "brand", children: "WebTube" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 16,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "search", children: [
      /* @__PURE__ */ jsxDEV("input", { className: "input", placeholder: "Search videos or tags", value: query, onChange: (e) => setQuery(e.target.value) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 18,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: onOpenUpload, children: "Upload" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 19,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: onOpenProfile, children: "My Profile" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 20,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 17,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 15,
    columnNumber: 5
  }, this);
}
function ProfileModal({ open, onClose }) {
  const user = useCurrentUser();
  const { data: profile } = useQuery(user ? room.collection("profiles").filter({ id: user.id }) : null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  useEffect(() => {
    if (profile && profile[0]) {
      setDisplayName(profile[0].display_name || "");
      setBio(profile[0].bio || "");
    }
  }, [profile]);
  if (!open) return null;
  const save = async () => {
    if (!user) return;
    await room.collection("profiles").upsert({
      id: user.id,
      display_name: displayName.trim() || user.username,
      bio,
      channel: { updated_at: (/* @__PURE__ */ new Date()).toISOString() }
    });
    await room.collection("leaderboard").upsert({
      id: user.id,
      data: { profile_complete: true }
    });
    onClose();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "h2", children: "Edit Profile" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 56,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Display Name" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 57,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("input", { className: "input", value: displayName, onChange: (e) => setDisplayName(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 58,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Bio" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 59,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("textarea", { value: bio, onChange: (e) => setBio(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 60,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "row", style: { justifyContent: "flex-end", marginTop: 12 }, children: [
      /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: onClose, children: "Cancel" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 62,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "btn", onClick: save, children: "Save" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 63,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 61,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 55,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 54,
    columnNumber: 5
  }, this);
}
async function uploadFileAndGetUrl(file) {
  const url = await window.websim.upload(file);
  return url;
}
async function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = reject;
    v.src = url;
  });
}
function UploadModal({ open, onClose }) {
  const user = useCurrentUser();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [kind, setKind] = useState("video");
  const [busy, setBusy] = useState(false);
  const canSubmit = file && title.trim().length > 0 && !busy;
  if (!open) return null;
  const submit = async () => {
    if (!user || !file) return;
    setBusy(true);
    try {
      let duration = await getVideoDuration(file);
      if (kind === "short" && duration > 60.05) {
        alert("Shorts must be 60 seconds or less.");
        setBusy(false);
        return;
      }
      const url = await uploadFileAndGetUrl(file);
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      await room.collection("videos").upsert({
        title: title.trim(),
        description: desc,
        url,
        type: kind,
        duration_seconds: Math.round(duration),
        tags: tagList
      });
      await room.collection("leaderboard").upsert({
        id: user.id,
        data: { last_upload_at: (/* @__PURE__ */ new Date()).toISOString() }
      });
      onClose();
      setFile(null);
      setTitle("");
      setDesc("");
      setTags("");
      setKind("video");
    } catch (e) {
      console.error(e);
      alert("Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "h2", children: "Upload" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 135,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Type" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 136,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("select", { value: kind, onChange: (e) => setKind(e.target.value), children: [
      /* @__PURE__ */ jsxDEV("option", { value: "video", children: "Normal Video" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 138,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("option", { value: "short", children: "Short" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 139,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 137,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "small", children: "Shorts are mobile-optimized and limited to 60s." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 141,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "File" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 142,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("input", { type: "file", accept: "video/*", onChange: (e) => setFile(e.target.files?.[0] || null) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 143,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Title" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 144,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("input", { className: "input", value: title, onChange: (e) => setTitle(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 145,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Description" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 146,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("textarea", { value: desc, onChange: (e) => setDesc(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 147,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Tags (comma-separated)" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 148,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("input", { className: "input", placeholder: "e.g. tech, tutorial", value: tags, onChange: (e) => setTags(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 149,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "row", style: { justifyContent: "space-between", marginTop: 12 }, children: [
      /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: onClose, children: "Cancel" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 151,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "btn", disabled: !canSubmit, onClick: submit, children: busy ? "Uploading..." : "Upload" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 152,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 150,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 134,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 133,
    columnNumber: 5
  }, this);
}
function EditVideoModal({ open, onClose, video }) {
  const [title, setTitle] = useState(video?.title || "");
  const [desc, setDesc] = useState(video?.description || "");
  const [tags, setTags] = useState((video?.tags || []).join(", "));
  useEffect(() => {
    setTitle(video?.title || "");
    setDesc(video?.description || "");
    setTags((video?.tags || []).join(", "));
  }, [video]);
  if (!open || !video) return null;
  const save = async () => {
    await room.collection("videos").upsert({
      id: video.id,
      title: title.trim(),
      description: desc,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean)
    });
    onClose();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "h2", children: "Edit Video" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 181,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Title" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 182,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("input", { className: "input", value: title, onChange: (e) => setTitle(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 183,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Description" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 184,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("textarea", { value: desc, onChange: (e) => setDesc(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 185,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("label", { children: "Tags (comma-separated)" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 186,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("input", { className: "input", value: tags, onChange: (e) => setTags(e.target.value) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 187,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "row", style: { justifyContent: "flex-end", marginTop: 12 }, children: [
      /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: onClose, children: "Cancel" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 189,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "btn", onClick: save, children: "Save" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 190,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 188,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 180,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 179,
    columnNumber: 5
  }, this);
}
function DeleteConfirmModal({ open, onClose, onConfirm, title }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText("");
  }, [open]);
  if (!open) return null;
  return /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop", onClick: onClose, children: /* @__PURE__ */ jsxDEV("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "h2", children: "Delete Video" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 204,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("p", { children: [
      "Type ",
      /* @__PURE__ */ jsxDEV("span", { className: "kbd", children: "DELETE" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 205,
        columnNumber: 17
      }, this),
      " to confirm removing \u201C",
      title,
      "\u201D. This cannot be undone."
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 205,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("input", { className: "input", value: text, onChange: (e) => setText(e.target.value), placeholder: "DELETE" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 206,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "row", style: { justifyContent: "flex-end", marginTop: 12 }, children: [
      /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: onClose, children: "Cancel" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 208,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "btn", disabled: text !== "DELETE", onClick: onConfirm, children: "Delete" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 209,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 207,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 203,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 202,
    columnNumber: 5
  }, this);
}
function VideoCard({ v, canEdit, onEdit, onDelete }) {
  const isShort = v.type === "short";
  return /* @__PURE__ */ jsxDEV("div", { className: "card", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "thumb", style: isShort ? { padding: 0 } : void 0, children: /* @__PURE__ */ jsxDEV("video", { className: "video-el", src: v.url, controls: true, playsInline: true, style: isShort ? { aspectRatio: "9 / 16", width: "auto", height: "320px" } : {} }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 221,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 220,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "meta", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 600 }, children: v.title }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 224,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "small", children: v.description || "" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 225,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "tags", children: (v.tags || []).map((t) => /* @__PURE__ */ jsxDEV("span", { className: "tag", children: [
        "#",
        t
      ] }, t, true, {
        fileName: "<stdin>",
        lineNumber: 226,
        columnNumber: 56
      }, this)) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 226,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxDEV("span", { className: "small", children: [
          isShort ? "Short" : "Video",
          " \u2022 ",
          v.duration_seconds ? `${v.duration_seconds}s` : ""
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 228,
          columnNumber: 11
        }, this),
        canEdit && /* @__PURE__ */ jsxDEV("span", { className: "group", children: [
          /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: () => onEdit(v), children: "Edit" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 231,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: () => onDelete(v), children: "Delete" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 232,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 230,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 227,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 223,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 219,
    columnNumber: 5
  }, this);
}
function ProfileView({ username, onBack }) {
  const current = useCurrentUser();
  const { data: users } = useQuery(username ? room.query(
    "select u.id, u.username from public.user u where u.username = $1 limit 1",
    [username]
  ) : null);
  const userId = users && users[0]?.id;
  const { data: prof } = useQuery(userId ? room.collection("profiles").filter({ id: userId }) : null);
  const { data: vids = [], loading } = useQuery(userId ? room.collection("videos").filter({ user_id: userId }) : null);
  const p = prof && prof[0];
  return /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "row", style: { justifyContent: "space-between", marginBottom: 16 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "row", style: { gap: 12 }, children: [
        /* @__PURE__ */ jsxDEV("img", { src: `https://images.websim.com/avatar/${username}`, alt: "", width: "56", height: "56", style: { borderRadius: 12, border: "1px solid var(--border)" } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 255,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 700 }, children: p?.display_name || username }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 257,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "small", children: [
            "@",
            username
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 258,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 256,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 254,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "btn ghost", onClick: onBack, children: "Back" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 261,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 253,
      columnNumber: 7
    }, this),
    p?.bio && /* @__PURE__ */ jsxDEV("p", { className: "small", style: { marginTop: 0 }, children: p.bio }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 263,
      columnNumber: 18
    }, this),
    /* @__PURE__ */ jsxDEV("hr", { className: "hr" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 264,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("h2", { className: "h2", children: "Uploads" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 265,
      columnNumber: 7
    }, this),
    loading ? /* @__PURE__ */ jsxDEV("div", { className: "small", children: "Loading\u2026" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 266,
      columnNumber: 18
    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "card-grid", children: vids.map(
      (v) => /* @__PURE__ */ jsxDEV(VideoCard, { v, canEdit: current && current.id === v.user_id, onEdit: () => {
      }, onDelete: () => {
      } }, v.id, false, {
        fileName: "<stdin>",
        lineNumber: 269,
        columnNumber: 13
      }, this)
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 267,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 252,
    columnNumber: 5
  }, this);
}
function Main() {
  const user = useCurrentUser();
  const { data: videos = [], loading } = useQuery(room.collection("videos"));
  const [query, setQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [delVideo, setDelVideo] = useState(null);
  const profileUsername = useMemo(() => new URLSearchParams(window.location.search).get("profile"), []);
  const filtered = useMemo(() => {
    if (!query.trim()) return videos;
    const q = query.toLowerCase();
    return videos.filter((v) => {
      const inText = (v.title || "").toLowerCase().includes(q) || (v.description || "").toLowerCase().includes(q);
      const inTags = (v.tags || []).some((t) => t.toLowerCase().includes(q));
      return inText || inTags;
    });
  }, [videos, query]);
  const regular = filtered.filter((v) => v.type === "video");
  const shorts = filtered.filter((v) => v.type === "short");
  const onDelete = async (v) => {
    setDelVideo(v);
  };
  const confirmDelete = async () => {
    if (!delVideo) return;
    try {
      await room.collection("videos").delete(delVideo.id);
    } catch (e) {
      alert("Delete failed (you can only delete your own video).");
    } finally {
      setDelVideo(null);
    }
  };
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(Header, { query, setQuery, onOpenUpload: () => setShowUpload(true), onOpenProfile: () => setShowProfile(true) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 316,
      columnNumber: 7
    }, this),
    profileUsername ? /* @__PURE__ */ jsxDEV(ProfileView, { username: profileUsername, onBack: () => {
      const base = window.baseUrl || window.location.origin + window.location.pathname;
      window.location.href = base;
    } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 318,
      columnNumber: 9
    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "section", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "h2", children: "Regular Videos" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 322,
          columnNumber: 13
        }, this),
        loading ? /* @__PURE__ */ jsxDEV("div", { className: "small", children: "Loading\u2026" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 323,
          columnNumber: 24
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "card-grid", children: regular.map(
          (v) => /* @__PURE__ */ jsxDEV(VideoCard, { v, canEdit: user && user.id === v.user_id, onEdit: setEditVideo, onDelete }, v.id, false, {
            fileName: "<stdin>",
            lineNumber: 326,
            columnNumber: 19
          }, this)
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 324,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 321,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "section", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "h2", children: "Shorts" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 331,
          columnNumber: 13
        }, this),
        loading ? /* @__PURE__ */ jsxDEV("div", { className: "small", children: "Loading\u2026" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 332,
          columnNumber: 24
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "card-grid", children: shorts.map(
          (v) => /* @__PURE__ */ jsxDEV(VideoCard, { v, canEdit: user && user.id === v.user_id, onEdit: setEditVideo, onDelete }, v.id, false, {
            fileName: "<stdin>",
            lineNumber: 335,
            columnNumber: 19
          }, this)
        ) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 333,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 330,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 320,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(UploadModal, { open: showUpload, onClose: () => setShowUpload(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 341,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(ProfileModal, { open: showProfile, onClose: () => setShowProfile(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 342,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(EditVideoModal, { open: !!editVideo, onClose: () => setEditVideo(null), video: editVideo }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 343,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(DeleteConfirmModal, { open: !!delVideo, onClose: () => setDelVideo(null), onConfirm: confirmDelete, title: delVideo?.title }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 344,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 315,
    columnNumber: 5
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(Main, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 350,
  columnNumber: 13
}));
