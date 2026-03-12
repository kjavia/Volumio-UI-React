import React from 'react';
import { FaQuestion, FaHome } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="container mt-4">
      <div className="box">
        <div className="boxHeader d-flex justify-content-between align-items-center mb-3">
          <div className="title">
            <h2 className="m-0">Home</h2>
          </div>
          <a
            href="https://volumio.org/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            id="myvolumio-info"
          >
            <FaQuestion />
            <span className="d-none d-sm-inline">Volumio</span>
          </a>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title h5 m-0 d-flex align-items-center gap-2">
              <FaHome />
              <span>Home</span>
            </h3>
          </div>

          <div className="card-body">
            <h4>Discover all your best music and streams</h4>
            {/* Content to be populated */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

