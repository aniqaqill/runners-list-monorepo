import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from 'lucide-react';

interface Event {
  name: string;
  location: string;
  date: string;
  registration_url: string;
}

interface EventsTableProps {
  events: Event[];
}

export default function EventsTable({ events }: EventsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearchQuery =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.date.toLowerCase().includes(searchQuery.toLowerCase());

      const eventDate = new Date(event.date);
      const matchesMonth =
        selectedMonth === '' || eventDate.getMonth() === parseInt(selectedMonth);

      const matchesState =
        selectedState === '' || event.location.toLowerCase().includes(selectedState.toLowerCase());

      return matchesSearchQuery && matchesMonth && matchesState;
    });
  }, [events, searchQuery, selectedMonth, selectedState]);

  const isEventEnded = (date: string) => {
    const eventDate = new Date(date);
    const currentDate = new Date();
    return !isNaN(eventDate.getTime()) && eventDate < currentDate;
  };

  // need to change whenever we update the data
  const latestUpdateDate = "2025-01-04";

  return (
    <div className="mt-5 max-w-3xl overflow-hidden mx-auto">
      {/* Search and Filters Section */}
      <div className="mb-4 pt-4 px-2 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by event name, location, or date..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search events"
          />
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full sm:w-1/4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by month"
          >
            <option value="">All Months</option>
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>
          <select
            value={selectedState}
            onChange={handleStateChange}
            className="w-full sm:w-1/4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by state"
          >
            <option value="">All States</option>
            <option value="selangor">Selangor</option>
            <option value="penang">Penang</option>
            <option value="sarawak">Sarawak</option>
            <option value="johor">Johor</option>
            <option value="kedah">Kedah</option>
            <option value="kelantan">Kelantan</option>
            <option value="malacca">Malacca</option>
            <option value="negeri sembilan">Negeri Sembilan</option>
            <option value="pahang">Pahang</option>
            <option value="perak">Perak</option>
            <option value="perlis">Perlis</option>
            <option value="sabah">Sabah</option>
            <option value="terengganu">Terengganu</option>
            <option value="kuala lumpur">Kuala Lumpur</option>
            <option value="putrajaya">Putrajaya</option>
            <option value="labuan">Labuan</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <Table className="border border-gray-200">
        <TableHeader>
          <TableRow>
            <TableHead className="border-b border-gray-200 text-xs sm:text-sm md:text-base">Event Name</TableHead>
            <TableHead className="border-b border-gray-200 text-xs sm:text-sm md:text-base">Location</TableHead>
            <TableHead className="border-b border-gray-200 text-xs sm:text-sm md:text-base">Date</TableHead>
            <TableHead className="border-b border-gray-200 text-xs sm:text-sm md:text-base">Registration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvents.map((event: Event, index: number) => (
            <TableRow key={index} className="border-b border-gray-200 hover:bg-gray-400">
              <TableCell className=" text-xs sm:text-sm md:text-base">
                {event.name}
                {isEventEnded(event.date) && (
                  <span className="ml-2 text-red-500 text-xs">(Ended)</span>
                )}
              </TableCell>
              <TableCell className=" text-xs sm:text-sm md:text-base">{event.location}</TableCell>
              <TableCell className="w-40 px-4  text-xs sm:text-sm md:text-base">{event.date}</TableCell>
              <TableCell className="text-right text-xs sm:text-sm md:text-base">
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Register for event"
                >
                  <Button variant="ghost" size="sm">
                    <Link className="w-4 h-4" />
                  </Button>
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="text-center mt-4 text-sm text-gray-500">
        Latest update on {latestUpdateDate}
      </div>
    </div>
  );
}