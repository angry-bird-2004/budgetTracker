import React from "react";

const PaymentMethode = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Payment Method
      </label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
      >
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="bank">Bank Transfer</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
};

export default PaymentMethode;
