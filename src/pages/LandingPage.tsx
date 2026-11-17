import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, ShieldCheck, Users } from 'lucide-react';
import { EventCard } from '../components/EventCard';
import { PublicLayout } from '../layouts/PublicLayout';
import { eventsApi } from '../services/api';
import type { EventItem } from '../types';

export function LandingPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [labImgFailed, setLabImgFailed] = useState(false);

  useEffect(() => {
    eventsApi
      .list()
      .then((items) => {
        const upcoming = items.filter((e) => e.lifecycleStatus !== 'COMPLETED').slice(0, 3);
        setUpcomingEvents(upcoming);
      })
      .catch(() => {
        setUpcomingEvents([]);
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, []);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-6 py-14 lg:grid-cols-12 lg:py-20">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-sm font-medium text-indigo-700">
              University Academic &amp; Co-Curricular Operations
            </p>
            <h1
              className="mt-3 text-4xl font-extrabold tracking-tight text-[#0F2942] sm:text-5xl leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Centralized College Event Management &amp; Participation
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Coordinate campus symposia, technical workshops, and placement clinics in one
              role-controlled platform. Enforce seat capacities transactionally, eliminate duplicate
              registrations, and track verified attendance across departments.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white hover:bg-[#163859] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Browse Campus Events</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                Create Student Account
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {heroImgFailed ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-gradient-to-br from-[#0F2942] to-indigo-900 p-8 text-white">
                  <CalendarCheck2 className="h-12 w-12 text-indigo-200" />
                  <p className="mt-4 text-lg font-semibold">Innovation Hub &amp; Auditorium A1</p>
                  <p className="mt-1 text-sm text-indigo-100">
                    Centralized event scheduling and live capacity management
                  </p>
                </div>
              ) : (
                <img
                  src="/src/assets/images/campus_auditorium_hero_1794853617232.jpg"
                  alt="University innovation atrium and auditorium during an academic symposium"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflows */}
      <section id="workflows" className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#0F2942] sm:text-3xl">
            Structured Event Lifecycle
          </h2>
          <p className="mt-2 text-base text-slate-600">
            Designed around verified database transactions and strict backend role enforcement.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#0F2942]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              01. Role-Based Governance
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Separate portals and API permissions for Administrators, Faculty observers, and
              Students using BCrypt password hashing and JWT verification.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#0F2942]">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              02. Transactional Seat Allocation
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Every registration executes inside an atomic database transaction checking duplicate
              registrations, event completion, and remaining seat capacity.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#0F2942]">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              03. Attendance &amp; Participation Reports
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Faculty and administrators record present/absent attendance per participant and monitor
              real-time capacity utilization and turnout percentages.
            </p>
          </div>
        </div>
      </section>

      {/* Role Portals Split */}
      <section id="roles" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-6 py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="h-full min-h-[260px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {labImgFailed ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center bg-slate-100 p-8 text-slate-700">
                  <Users className="h-10 w-10 text-[#0F2942]" />
                  <p className="mt-3 text-base font-semibold">Departmental Workshop Studio</p>
                </div>
              ) : (
                <img
                  src="/src/assets/images/campus_workshop_lab_1794853618292.jpg"
                  alt="University students collaborating during a technical engineering workshop"
                  referrerPolicy="no-referrer"
                  onError={() => setLabImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center lg:col-span-7">
            <h2 className="text-2xl font-bold tracking-tight text-[#0F2942] sm:text-3xl">
              Dedicated Portals for Every Campus Stakeholder
            </h2>
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              <div className="py-4">
                <h3 className="text-sm font-semibold text-slate-900">Administrators</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Publish, edit, and remove campus events, inspect participant rosters, mark
                  attendance, and review institution-wide turnout analytics.
                </p>
              </div>
              <div className="py-4">
                <h3 className="text-sm font-semibold text-slate-900">Students</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Discover upcoming workshops and seminars, check live seat availability, register
                  in one click, and manage personal registration history.
                </p>
              </div>
              <div className="py-4">
                <h3 className="text-sm font-semibold text-slate-900">Faculty Coordinators</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Monitor departmental event participation, verify student rosters, record
                  attendance, and export participation insights without altering event definitions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview from Database */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0F2942]">
              Upcoming Campus Events
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Live schedule loaded directly from the campus SQLite database.
            </p>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 whitespace-nowrap"
          >
            View all events →
          </Link>
        </div>

        {loadingEvents ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-56 rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
              />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No upcoming events are scheduled yet. Sign in as an administrator to publish events.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
