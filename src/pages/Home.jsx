import AlbumBrowser from '@/components/AlbumBroswer';
import React from 'react';

const Home = () => {
  return (
    <div className="container-fluid mt-4">
      <AlbumBrowser
        albums={[
          { title: 'Album 1', artist: 'Artist A' },
          { title: 'Album 2', artist: 'Artist B' },
          { title: 'Album 3', artist: 'Artist C' },
          { title: 'Album 4', artist: 'Artist D' },
          { title: 'Album 5', artist: 'Artist E' },
          { title: 'Album 6', artist: 'Artist F' },
          { title: 'Album 7', artist: 'Artist G' },
          { title: 'Album 8', artist: 'Artist H' },
          { title: 'Album 9', artist: 'Artist I' },
          { title: 'Album 10', artist: 'Artist J' },
          { title: 'Album 11', artist: 'Artist K' },
          { title: 'Album 12', artist: 'Artist L' },
          { title: 'Album 13', artist: 'Artist M' },
          { title: 'Album 14', artist: 'Artist N' },
          { title: 'Album 15', artist: 'Artist O' },
        ]}
      />
    </div>
  );
};

export default Home;
