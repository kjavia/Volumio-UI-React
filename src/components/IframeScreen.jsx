import React from 'react';
import PropTypes from 'prop-types';

const IframeScreen = ({ url }) => {
  if (!url) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-white">
        <div className="text-center">
          <h3>No URL configured</h3>
          <p>Please configure an external URL in the plugin settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100 h-100 bg-black">
      <iframe
        src={url}
        title="External Content"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        allow="autoplay; encrypted-media"
      />
    </div>
  );
};

IframeScreen.propTypes = {
  url: PropTypes.string
};

export default IframeScreen;
