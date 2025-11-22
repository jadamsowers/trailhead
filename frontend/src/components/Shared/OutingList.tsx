import React from 'react';
import { Outing } from '../../types';

interface OutingListProps {
    outings: Outing[];
}

const OutingList: React.FC<OutingListProps> = ({ outings }) => {
    return (
        <div>
            <h2>Upcoming Outings</h2>
            <ul>
                {outings.map((outing) => (
                    <li key={outing.id}>
                        <h3>{outing.name}</h3>
                        <p>{outing.outing_date}</p>
                        <p>{outing.location}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default OutingList;