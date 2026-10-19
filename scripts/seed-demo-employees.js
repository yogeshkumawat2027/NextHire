
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const DATABASE_URL = process.env.DATABASE_URL;
const DEMO_PASSWORD = "12345678";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const employees = [
  {
    name: "Aarav Sharma",
    email: "employee1@nexthire.test",
    skills: ["React", "Next.js", "Node.js", "PostgreSQL", "TypeScript"],
    experience: 3,
    location: "Bengaluru",
    jobType: "Full-time",
    resume:
      "Full-stack developer experienced in React, Next.js, Node.js, TypeScript, PostgreSQL, REST APIs, authentication and database design.",
  },
  {
    name: "Priya Verma",
    email: "employee2@nexthire.test",
    skills: ["React", "TypeScript", "Tailwind CSS", "HTML", "CSS"],
    experience: 2,
    location: "Jaipur",
    jobType: "Full-time",
    resume:
      "Frontend developer experienced in React, TypeScript, Tailwind CSS, HTML, CSS and responsive user interfaces.",
  },
  {
    name: "Rohan Mehta",
    email: "employee3@nexthire.test",
    skills: ["Node.js", "Express.js", "PostgreSQL", "REST APIs", "Docker"],
    experience: 4,
    location: "Bengaluru",
    jobType: "Full-time",
    resume:
      "Backend developer experienced in Node.js, Express.js, PostgreSQL, SQL, REST APIs, Docker and backend architecture.",
  },
  {
    name: "Ananya Singh",
    email: "employee4@nexthire.test",
    skills: ["Python", "Django", "SQL", "PostgreSQL", "REST APIs"],
    experience: 3,
    location: "Pune",
    jobType: "Full-time",
    resume:
      "Python developer experienced in Django, SQL, PostgreSQL, REST APIs, database design and backend development.",
  },
  {
    name: "Kabir Patel",
    email: "employee5@nexthire.test",
    skills: ["JavaScript", "React", "Node.js", "Git", "REST APIs"],
    experience: 2,
    location: "Ahmedabad",
    jobType: "Full-time",
    resume:
      "Full-stack developer experienced in JavaScript, React, Node.js, Git, REST APIs and frontend-backend integration.",
  },
  {
    name: "Isha Gupta",
    email: "employee6@nexthire.test",
    skills: ["Next.js", "Supabase", "TypeScript", "PostgreSQL", "Tailwind CSS"],
    experience: 4,
    location: "Remote",
    jobType: "Remote",
    resume:
      "Full-stack developer experienced in Next.js, Supabase, TypeScript, PostgreSQL, Tailwind CSS and authentication.",
  },
  {
    name: "Dev Malhotra",
    email: "employee7@nexthire.test",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "SQL"],
    experience: 2,
    location: "Delhi",
    jobType: "Full-time",
    resume:
      "Python backend developer experienced in FastAPI, PostgreSQL, Docker, SQL, REST APIs and backend testing.",
  },
  {
    name: "Sneha Rao",
    email: "employee8@nexthire.test",
    skills: ["Java", "Spring Boot", "SQL", "REST APIs", "Git"],
    experience: 5,
    location: "Hyderabad",
    jobType: "Full-time",
    resume:
      "Java developer experienced in Spring Boot, SQL, REST APIs, Git and enterprise backend applications.",
  },
  {
    name: "Arjun Nair",
    email: "employee9@nexthire.test",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    experience: 1,
    location: "Kochi",
    jobType: "Internship",
    resume:
      "Junior web developer experienced in HTML, CSS, JavaScript, React and responsive web design.",
  },
  {
    name: "Meera Joshi",
    email: "employee10@nexthire.test",
    skills: ["Node.js", "Express.js", "AWS", "Docker", "PostgreSQL"],
    experience: 3,
    location: "Mumbai",
    jobType: "Full-time",
    resume:
      "Backend developer experienced in Node.js, Express.js, AWS, Docker, PostgreSQL, REST APIs and cloud deployment.",
  },
];

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Avoid accidentally duplicating existing demo accounts.
    const emails = employees.map((e) => e.email);

    const existing = await client.query(
      `SELECT email
       FROM public.users
       WHERE email = ANY($1::text[])`,
      [emails]
    );

    if (existing.rowCount > 0) {
      throw new Error(
        "These accounts already exist: " +
          existing.rows.map((r) => r.email).join(", ") +
          ". Delete the old demo records first."
      );
    }

    for (const employee of employees) {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

      const userResult = await client.query(
        `INSERT INTO public.users
           (name, email, password, role)
         VALUES ($1, $2, $3, 'employee')
         RETURNING id`,
        [employee.name, employee.email, passwordHash]
      );

      const userId = userResult.rows[0].id;

      await client.query(
        `INSERT INTO public.employee_profiles
           (user_id, resume_path, resume_text, skills,
            experience_years, preferred_location,
            preferred_job_type)
         VALUES ($1, NULL, $2, $3::text[], $4, $5, $6)`,
        [
          userId,
          employee.resume,
          employee.skills,
          employee.experience,
          employee.location,
          employee.jobType,
        ]
      );

      console.log("Created:", employee.email);
    }

    await client.query("COMMIT");

    console.log("\nAll 10 employees created successfully.");
    console.log("Demo password:", DEMO_PASSWORD);
    console.log("Passwords are stored as bcrypt hashes.");
    console.log("No actual PDF files were uploaded.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
});
