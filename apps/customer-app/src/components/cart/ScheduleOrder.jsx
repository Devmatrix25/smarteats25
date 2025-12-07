import React, { useState } from "react";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const timeSlots = [
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
  "8:00 PM - 9:00 PM",
  "9:00 PM - 10:00 PM"
];

export default function ScheduleOrder({ schedule, onScheduleChange }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(schedule?.date || null);
  const [selectedTime, setSelectedTime] = useState(schedule?.time || null);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(new Date(), i));
  }

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onScheduleChange({
        date: selectedDate,
        time: selectedTime,
        isScheduled: true
      });
      setShowDialog(false);
    }
  };

  const handleDeliverNow = () => {
    onScheduleChange({ isScheduled: false, date: null, time: null });
    setShowDialog(false);
  };

  // Filter time slots for today
  const getAvailableSlots = (date) => {
    if (isSameDay(date, new Date())) {
      const currentHour = new Date().getHours();
      return timeSlots.filter(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        const isPM = slot.includes('PM') && !slot.startsWith('12');
        const hour24 = isPM ? slotHour + 12 : (slot.startsWith('12') && slot.includes('PM')) ? 12 : slotHour;
        return hour24 > currentHour + 1; // At least 1 hour from now
      });
    }
    return timeSlots;
  };

  return (
    <>
      {/* Schedule Button */}
      <button
        onClick={() => setShowDialog(true)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-medium">
              {schedule?.isScheduled ? "Scheduled Delivery" : "Deliver Now"}
            </p>
            <p className="text-sm text-gray-500">
              {schedule?.isScheduled 
                ? `${format(new Date(schedule.date), "EEE, MMM d")} • ${schedule.time}`
                : "35-45 mins"
              }
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Schedule Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Your Delivery</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Deliver Now Option */}
            <button
              onClick={handleDeliverNow}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                !schedule?.isScheduled 
                  ? "border-green-500 bg-green-50" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                🚀
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold">Deliver Now</p>
                <p className="text-sm text-gray-500">35-45 mins delivery</p>
              </div>
              {!schedule?.isScheduled && (
                <Badge className="bg-green-500">Selected</Badge>
              )}
            </button>

            {/* Date Selection */}
            <div>
              <h4 className="font-medium mb-3">Select Date</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((date, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(date.toISOString());
                      setSelectedTime(null);
                    }}
                    className={cn(
                      "flex-shrink-0 w-16 p-3 rounded-xl border-2 text-center transition-all",
                      selectedDate && isSameDay(new Date(selectedDate), date)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <p className="text-xs text-gray-500">
                      {idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : format(date, "EEE")}
                    </p>
                    <p className="font-bold text-lg">{format(date, "d")}</p>
                    <p className="text-xs text-gray-500">{format(date, "MMM")}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <h4 className="font-medium mb-3">Select Time Slot</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {getAvailableSlots(new Date(selectedDate)).map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-sm transition-all",
                        selectedTime === slot
                          ? "border-purple-500 bg-purple-50 font-medium"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
            className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl h-12"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule for {selectedDate && format(new Date(selectedDate), "MMM d")} {selectedTime && `at ${selectedTime.split(' - ')[0]}`}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}