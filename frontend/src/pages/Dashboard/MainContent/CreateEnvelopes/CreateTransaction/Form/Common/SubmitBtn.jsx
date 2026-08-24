import React from "react";

const SubmitBtn = ({ isSubmitting, editingTxId }) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all duration-200 active:scale-[0.99] shadow-sm disabled:shadow-none"
    >
      {isSubmitting
        ? editingTxId
          ? "Updating Transaction..."
          : "Adding Transaction..."
        : editingTxId
          ? "Update Transaction"
          : "Add Transaction"}
    </button>
  );
};

export default SubmitBtn;
