import React from 'react';
import { Trip } from '../../types';

interface TripListProps {
    trips: Trip[];
}

const TripList: React.FC<TripListProps> = ({ trips }) => {
    return (
        <div>
            <h2>Upcoming Trips</h2>
            <ul>
                {trips.map((trip) => (
                    <li key={trip.id}>
                        <h3>{trip.name}</h3>
                        <p>{trip.trip_date}</p>
                        <p>{trip.location}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TripList;