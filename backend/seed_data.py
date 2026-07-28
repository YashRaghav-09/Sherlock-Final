"""
Run this once after starting the backend for the first time to populate
sample data so your dashboard/UI has something to show immediately.

    python seed_data.py
"""
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
import models
from auth import hash_password

Base.metadata.create_all(bind=engine)


def run():
    db = SessionLocal()
    try:
        if db.query(models.Officer).count() > 0:
            print("Database already has data. Skipping seed (delete sherlock.db to reset).")
            return

        # --- Demo officer (matches the badge ID shown in your UI mock) ---
        officer = models.Officer(
            badge_id="IND-45871",
            name="Officer Shubh",
            station="New Delhi Central",
            role="Officer",
            hashed_password=hash_password("password123"),
            is_online=True,
        )
        db.add(officer)
        db.commit()
        db.refresh(officer)

        # --- Cases ---
        cases = [
            models.Case(
                case_number="CASE-2026-1001",
                title="Robbery at Karol Bagh market",
                description="Reported theft of electronics from a shop near Karol Bagh metro station.",
                status="Under Investigation",
                priority="High",
                location="Karol Bagh, New Delhi",
                latitude=28.6519, longitude=77.1909,
                officer_id=officer.id,
            ),
            models.Case(
                case_number="CASE-2026-1002",
                title="Hit and run near Rajendra Nagar",
                description="Vehicle collision, driver fled the scene. Witness statements collected.",
                status="Open",
                priority="Critical",
                location="Rajendra Nagar, New Delhi",
                latitude=28.6414, longitude=77.1699,
                officer_id=officer.id,
            ),
            models.Case(
                case_number="CASE-2026-1003",
                title="Missing person report - Sarai Rohilla",
                description="Teenager reported missing by family, last seen near the railway station.",
                status="Open",
                priority="High",
                location="Sarai Rohilla, New Delhi",
                latitude=28.6667, longitude=77.1833,
                officer_id=officer.id,
            ),
            models.Case(
                case_number="CASE-2026-1004",
                title="Vandalism at Gandhi Nagar market",
                description="Multiple shop shutters damaged overnight, CCTV footage under review.",
                status="Closed",
                priority="Low",
                location="Gandhi Nagar, New Delhi",
                latitude=28.6667, longitude=77.2500,
                officer_id=officer.id,
            ),
        ]
        db.add_all(cases)
        db.commit()

        # --- Missing Persons ---
        db.add_all([
            models.MissingPerson(
                name="Ayaan Verma",
                age=16,
                gender="Male",
                height_cm=165,
                identifying_marks="Small scar above left eyebrow",
                last_seen_location="Sarai Rohilla Railway Station",
                last_seen_date=datetime.utcnow() - timedelta(days=2),
                description="Wearing a grey hoodie and blue jeans, carrying a black backpack.",
                status="Missing",
                reported_by="Family member",
                case_id=cases[2].id,
            ),
            models.MissingPerson(
                name="Priya Sharma",
                age=24,
                gender="Female",
                height_cm=160,
                identifying_marks="Tattoo on right wrist",
                last_seen_location="Paharganj Market",
                last_seen_date=datetime.utcnow() - timedelta(days=10),
                description="Last seen wearing a red kurta.",
                status="Found",
                reported_by="Friend",
            ),
        ])

        # --- Vehicles ---
        db.add_all([
            models.Vehicle(
                plate_number="DL-4C-8821",
                make="Maruti Suzuki",
                model="Swift",
                color="White",
                owner_name="Rakesh Kumar",
                status="Stolen",
                notes="Reported stolen from Anand Parbat parking lot.",
            ),
            models.Vehicle(
                plate_number="DL-8S-1190",
                make="Honda",
                model="City",
                color="Black",
                owner_name="Unknown",
                status="Flagged",
                notes="Involved in the Rajendra Nagar hit-and-run case.",
                case_id=cases[1].id,
            ),
            models.Vehicle(
                plate_number="DL-1C-4432",
                make="Hyundai",
                model="i20",
                color="Silver",
                owner_name="Meena Gupta",
                status="Clear",
            ),
        ])

        # --- Criminal Records ---
        db.add_all([
            models.CriminalRecord(
                name="Vikram Singh",
                aliases="Vicky",
                age=34,
                gender="Male",
                charges="Theft, Robbery",
                status="Wanted",
                last_known_location="Karol Bagh area",
                risk_level="High",
            ),
            models.CriminalRecord(
                name="Sanjay Rathore",
                aliases="Sanju",
                age=29,
                gender="Male",
                charges="Vandalism, Public disturbance",
                status="In Custody",
                last_known_location="Gandhi Nagar Police Station",
                risk_level="Low",
            ),
        ])

        # --- Live locations (for the dashboard map) ---
        db.add_all([
            models.LiveLocation(label="Patrol Unit 12", latitude=28.6448, longitude=77.2167, status="patrol"),
            models.LiveLocation(label="Patrol Unit 07", latitude=28.6519, longitude=77.1909, status="case-site"),
        ])

        db.commit()
        print("Seed data created successfully.")
        print("Demo login -> badge_id: IND-45871 | password: password123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
