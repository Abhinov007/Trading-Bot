import React, { useEffect, useState } from "react";
import axios from "axios";

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch transactions
  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/transactions");
      setTransactions(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setLoading(false);
    }
  };

  // Fetch on mount + set up polling
  useEffect(() => {
    fetchTransactions(); // Initial fetch

    const interval = setInterval(() => {
      fetchTransactions();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="p-6 bg-white w-7xl m-auto min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-center">Transaction History</h2>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-center">No transactions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Ticker</th>
                <th className="py-3 px-4 text-left">Action</th>
                <th className="py-3 px-4 text-left">Quantity</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Message</th>
                <th className="py-3 px-4 text-left">Order ID</th>
                <th className="py-3 px-4 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b hover:bg-gray-100">
                  <td className="py-2 px-4">{tx.ticker}</td>
                  <td className="py-2 px-4">{tx.action}</td>
                  <td className="py-2 px-4">{tx.quantity}</td>
                  <td className="py-2 px-4">{tx.status}</td>
                  <td className="py-2 px-4">{tx.message}</td>
                  <td className="py-2 px-4 break-all text-sm">{tx.order_id || "-"}</td>
                  <td className="py-2 px-4">{tx.executed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Transaction;
