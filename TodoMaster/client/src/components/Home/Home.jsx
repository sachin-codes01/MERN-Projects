import React from "react";
import "./Home.css";

const Home = ({ setPage }) => {
    return (
        <div className="home-page">

            <div className="home-navbar">
                <div className="home-logo">
                    <span>✓</span>TodoMaster
                </div>
                <div className="home-nav-btns">
                    <button className="home-login-btn" onClick={() => setPage("login")}>Login</button>
                    <button className="home-register-btn" onClick={() => setPage("register")}> Register </button>
                </div>
            </div>

            <hr />

            <div className="hero-section">

                <div className="hero-left">
                    <h1>Organize Your Work<br />
                        <span>Stay Productive.</span>
                    </h1>
                    <p>TodoMaster helps you manage your daily tasks,
                        organize projects and improve productivity with a
                        clean and simple interface.</p>
                    <button className="hero-btn" onClick={() => setPage("register")}>Get Started</button>
                </div>

                <div className="hero-right">
                    <div className="hero-img-wrap">
                        <img src="/TodoMaster.webp" alt="Todo Illustration" />
                    </div>
                </div>

            </div>

        </div>
    );
};

export default Home;