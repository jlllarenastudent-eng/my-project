import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [videoURL, setVideoURL] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchTasks();
  }, [session]);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("id", { ascending: true });
    if (error) console.error("Error fetching tasks:", error);
    else setTasks(data);
  }

  async function signUp(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for verification link!");
  }

  async function signIn(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function uploadFile(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const filePath = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("uploads").upload(filePath, file);
    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }

    const { data: publicURL } = supabase.storage.from("uploads").getPublicUrl(filePath);
    if (type === "image") setImageURL(publicURL.publicUrl);
    else if (type === "video") setVideoURL(publicURL.publicUrl);
  }

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          description,
          user_id: session.user.id,
          image_url: imageURL || null,
          video_url: videoURL || null,
        },
      ])
      .select();

    if (error) console.error("Error adding task:", error);
    else setTasks([...tasks, data[0]]);

    setTitle("");
    setDescription("");
    setImageURL("");
    setVideoURL("");
  }

  async function deleteTask(id) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) console.error("Error deleting task:", error);
    else setTasks(tasks.filter((t) => t.id !== id));
  }

  function startEditing(id, title, description) {
    setEditingId(id);
    setEditingTitle(title);
    setEditingDescription(description);
  }

  async function updateTask(id) {
    if (!editingTitle.trim() || !editingDescription.trim()) return;

    const { error } = await supabase
      .from("tasks")
      .update({ title: editingTitle, description: editingDescription })
      .eq("id", id);

    if (error) console.error("Error updating task:", error);
    else {
      setTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, title: editingTitle, description: editingDescription } : t
        )
      );
      setEditingId(null);
    }
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">WELCOME!</h1>
        <form className="flex flex-col gap-4 w-full max-w-sm bg-white p-6 rounded-lg shadow-md" onSubmit={signIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded" type="submit">Sign In</button>
          <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded" type="button" onClick={signUp}>
            Sign Up
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-700">My Task Tracker</h1>
          <button onClick={signOut} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Sign Out</button>
        </div>

        <form className="flex flex-col gap-3 mb-4" onSubmit={addTask}>
          <input
            type="text"
            placeholder="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded"
          />
          <textarea
            placeholder="Task Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded"
          />
          <input type="file" accept="image/*" onChange={(e) => uploadFile(e, "image")} />
          <input type="file" accept="video/*" onChange={(e) => uploadFile(e, "video")} />
          <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded" type="submit">
            Add Task
          </button>
        </form>

        <ul className="flex flex-col gap-4">
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet...</p>
          ) : (
            tasks.map((task) => (
              <li key={task.id} className="bg-gray-50 p-4 rounded shadow border-l-4 border-blue-600">
                {editingId === task.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="border p-2 rounded w-full mb-2"
                    />
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      className="border p-2 rounded w-full mb-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => updateTask(task.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    <p className="text-gray-700 mb-2">{task.description}</p>
                    {task.image_url && <img src={task.image_url} alt="Task" className="w-full rounded mb-2" />}
                    {task.video_url && (
                      <video controls className="w-full rounded mb-2">
                        <source src={task.video_url} type="video/mp4" />
                      </video>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(task.id, task.title, task.description)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
                        Edit
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default App;
