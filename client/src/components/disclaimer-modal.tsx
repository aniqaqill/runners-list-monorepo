import React from "react";
import { Button } from "@/components/ui/button";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-6 rounded-lg shadow-lg max-w-md mx-4 bg-white dark:bg-black text-black dark:text-white">
        <h2 className="text-xl font-bold mb-4">Disclaimer</h2>
        <p className="mb-4">
          By using this website, you acknowledge that the information provided is for general
          informational purposes only. We are not responsible for any inaccuracies or changes in
          event details. Always verify event information with the official organizers.
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>I Understand</Button>
        </div>
      </div>
    </div>
  );
}