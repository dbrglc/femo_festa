const sampleLeaderboard = [
    { name: 'Team A', score: 320 },
    { name: 'Team B', score: 270 },
    { name: 'Team C', score: 220 },
];
export const handler = async (_event) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaderboard: sampleLeaderboard }),
    };
};
