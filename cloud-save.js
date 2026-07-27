(() => {
  "use strict";

  const CONFIG = window.ECLIPSE_CLOUD_CONFIG || {};
  const configured =
    CONFIG.supabaseUrl &&
    CONFIG.supabaseAnonKey &&
    !CONFIG.supabaseUrl.includes("INCOLLA_QUI") &&
    !CONFIG.supabaseAnonKey.includes("INCOLLA_QUI");

  let client = null;
  let currentUser = null;

  function safeParse(value, fallback = null) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function getLocalBundle() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      run: safeParse(localStorage.getItem("eclipseSave")),
      meta: safeParse(localStorage.getItem("eclipseMeta"), { essence: 0, legacy: {} }),
      record: safeParse(localStorage.getItem("eclipseRecord"), { room: 0, score: 0 }),
      codex: safeParse(localStorage.getItem("eclipseCodex"), []),
      settings: safeParse(localStorage.getItem("eclipseSettings"), {}),
      storySeen: localStorage.getItem("eclipseStorySeen") || null
    };
  }

  function applyBundle(bundle) {
    if (!bundle || typeof bundle !== "object") {
      throw new Error("Salvataggio cloud non valido.");
    }

    const setJson = (key, value) => {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    };

    setJson("eclipseSave", bundle.run);
    setJson("eclipseMeta", bundle.meta);
    setJson("eclipseRecord", bundle.record);
    setJson("eclipseCodex", bundle.codex);
    setJson("eclipseSettings", bundle.settings);

    if (bundle.storySeen) localStorage.setItem("eclipseStorySeen", bundle.storySeen);
    else localStorage.removeItem("eclipseStorySeen");
  }

  async function init() {
    if (!configured || !window.supabase?.createClient) {
      window.dispatchEvent(new CustomEvent("eclipse-cloud-ready", {
        detail: { configured: false, user: null }
      }));
      return;
    }

    client = window.supabase.createClient(
      CONFIG.supabaseUrl,
      CONFIG.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;

    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      window.dispatchEvent(new CustomEvent("eclipse-auth-change", {
        detail: { user: currentUser }
      }));
    });

    window.dispatchEvent(new CustomEvent("eclipse-cloud-ready", {
      detail: { configured: true, user: currentUser }
    }));
  }

  async function register(email, password) {
    if (!client) throw new Error("Cloud non configurato.");
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.href.split("#")[0] }
    });
    if (error) throw error;
    return data;
  }

  async function login(email, password) {
    if (!client) throw new Error("Cloud non configurato.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    return data;
  }

  async function logout() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
    currentUser = null;
  }

  async function resetPassword(email) {
    if (!client) throw new Error("Cloud non configurato.");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href.split("#")[0]
    });
    if (error) throw error;
  }

  async function upload() {
    if (!client || !currentUser) throw new Error("Devi prima accedere.");
    const payload = getLocalBundle();
    const { error } = await client
      .from("game_saves")
      .upsert({
        user_id: currentUser.id,
        save_data: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    if (error) throw error;
    return payload.savedAt;
  }

  async function download() {
    if (!client || !currentUser) throw new Error("Devi prima accedere.");
    const { data, error } = await client
      .from("game_saves")
      .select("save_data, updated_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Nessun salvataggio cloud trovato.");
    applyBundle(data.save_data);
    return data.updated_at;
  }

  window.EclipseCloud = {
    configured,
    init,
    register,
    login,
    logout,
    resetPassword,
    upload,
    download,
    getUser: () => currentUser,
    getLocalBundle,
    applyBundle
  };

  init().catch(error => {
    console.error("Errore inizializzazione cloud:", error);
    window.dispatchEvent(new CustomEvent("eclipse-cloud-error", {
      detail: { message: error.message }
    }));
  });
})();
