import React, { useEffect, useState } from 'react'
import "./Todo.css"
import axios from 'axios'

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/todomaster` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config;
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

const Todo = ({ setPage }) => {
  const [todo, setTodo] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
  })
  const [show, setShow] = useState([])
  const [editIndex, setEditIndex] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({})
  const [errors, setErrors] = useState({})

  const userInfo = JSON.parse(localStorage.getItem("user")) || {}
  const username = userInfo?.username;

  const getTodo = async () => {
    try {
      const response = await api.get("/")
      setShow(response.data)
    } catch (error) {
      alert(error.response?.data?.message)
    }
  }

  useEffect(() => {
    getTodo()
  }, [])

  const openAddPopup = () => {
    setTodo({
      title: "",
      description: "",
      status: "Pending",
      priority: "Medium",
    })
    setEditIndex(null)
    setErrors({})
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
    setTodo({
      title: "",
      description: "",
      status: "Pending",
      priority: "Medium",
    })
    setEditIndex(null)
    setErrors({})
  }

  const validate = () => {
    const newErrors = {}

    if (!todo.title.trim()) {
      newErrors.title = "Title is required"
    } else if (todo.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters"
    } else if (todo.title.trim().length > 50) {
      newErrors.title = "Title must be under 50 characters"
    }

    if (!todo.description.trim()) {
      newErrors.description = "Description is required"
    } else if (todo.description.trim().length < 5) {
      newErrors.description = "Description must be at least 5 characters"
    } else if (todo.description.trim().length > 300) {
      newErrors.description = "Description must be under 300 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addTodo = async () => {
    if (!validate()) return
    try {
      await api.post("/", todo)
      closePopup()
      getTodo()
    } catch (error) {
      alert(error.response?.data?.message)
    }
  }

  const fillData = (item) => {
    setTodo({
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
    })
    setEditIndex(item._id)
    setErrors({})
    setShowPopup(true)
  }

  const updateTodo = async (editIndex) => {
    if (!validate()) return
    try {
      await api.put(`/${editIndex}`, todo)
      closePopup()
      getTodo()
    } catch (error) {
      alert(error.response.data.message)
    }
  }

  const changeStatus = async (id, newStatus, item) => {
    try {
      await api.put(`/${id}`, { ...item, status: newStatus })
      getTodo()
    } catch (error) {
      alert(error.response?.data?.message)
    }
  }

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/${id}`)
      getTodo()
    } catch (error) {
      alert(error.response.data.message)
    }
  }

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredTodos = show.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.priority.toLowerCase().includes(search.toLowerCase()) ||
    item.status.toLowerCase().includes(search.toLowerCase())
  );

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setPage("login")
  }

  return (
    <div className="todo-page">


      <div className="header">
        <div className="logo">
          <span>✓</span> TodoMaster
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>


      </div>

      <p className="username-text">
        <strong>Username:</strong> {username}
      </p>

      <div className="search-row">

        <input
          type="text"
          placeholder="Search Todo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <button
          className="add-btn"
          onClick={openAddPopup}
          title="Add Todo"
        >
          +
        </button>


      </div>

      <div className="todo-grid">
        {filteredTodos.map((item) => (
          <div key={item._id} className="todo-card">

            <div className="card-top">
              <span className={`priority-badge priority-${item.priority?.toLowerCase()}`}>{item.priority}</span>
              <select className="status-select" value={item.status} onChange={(e) => changeStatus(item._id, e.target.value, item)}>
                <option value="Pending">Pending</option>
                <option value="In Pending">In Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <p className="card-title">{item.title}</p>

            <div className="desc-row">
              <p className={`card-desc ${expanded[item._id] ? "expanded" : ""}`}>{item.description}</p>
              <button className={`drop-btn ${expanded[item._id] ? "open" : ""}`} onClick={() => toggleExpand(item._id)} title="Toggle description">▼</button>
            </div>

            <div className="card-actions">
              <button className="edit-btn" onClick={() => fillData(item)}>Edit</button>
              <button className="delete-btn" onClick={() => deleteTodo(item._id)}>Delete</button>
            </div>

          </div>
        ))}
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>

            <div className="popup-header">
              <h3>{editIndex === null ? "Add Todo" : "Edit Todo"}</h3>
              <button className="close-btn" onClick={closePopup}>✕</button>
            </div>

            <div className="field-group">
              <label>Title</label>
              <input type="text" placeholder="Title..." value={todo.title} className={errors.title ? "input-error" : ""} onChange={(e) => setTodo({ ...todo, title: e.target.value })} />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="field-group">
              <label>Description</label>
              <textarea placeholder="Description" value={todo.description} className={errors.description ? "input-error" : ""} onChange={(e) => setTodo({ ...todo, description: e.target.value })} />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>

            <div className="field-group">
              <label>Status</label>
              <select value={todo.status} onChange={(e) => setTodo({ ...todo, status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="In Pending">In Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="field-group">
              <label>Priority</label>
              <select value={todo.priority} onChange={(e) => setTodo({ ...todo, priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <button className="submit-btn" onClick={() => editIndex === null ? addTodo() : updateTodo(editIndex)}>
              {editIndex === null ? "Submit" : "Update"}
            </button>

          </div>
        </div>
      )}
    </div>
  )
}

export default Todo