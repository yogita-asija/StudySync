import { auth } from "@/lib/auth";
import { completeOnboarding } from "./actions";

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Biology",
  "English Literature",
  "Economics",
  "History",
];

const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default async function OnboardingPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        action={completeOnboarding}
        className="w-full max-w-lg space-y-6 rounded-lg bg-white p-8 shadow"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session?.user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Let&apos;s set up your profile so we can match you with the right study groups.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your timezone
          </label>
          <select
            name="timezone"
            required
            className="mt-1 w-full rounded border border-gray-300 p-2"
          >
            <option value="">Select timezone</option>
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your level
          </label>
          <select
            name="level"
            required
            className="mt-1 w-full rounded border border-gray-300 p-2"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subjects you&apos;re interested in
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SUBJECT_OPTIONS.map((subject) => (
              <label
                key={subject}
                className="flex items-center gap-2 rounded border border-gray-200 p-2 text-sm"
              >
                <input type="checkbox" name="subjects" value={subject} />
                {subject}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
