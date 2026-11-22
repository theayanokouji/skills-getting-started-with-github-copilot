import pytest
from fastapi.testclient import TestClient

import src.app as app_module


@pytest.fixture
def client(monkeypatch):
    test_activities = {
        "Chess Club": {
            "description": "Play chess",
            "schedule": "Mondays",
            "max_participants": 3,
            "participants": ["existing@mergington.edu"],
        },
        "Art Club": {
            "description": "Make art",
            "schedule": "Tuesdays",
            "max_participants": 2,
            "participants": [],
        },
    }
    monkeypatch.setattr(app_module, "activities", test_activities)

    with TestClient(app_module.app) as test_client:
        yield test_client


def test_get_activities_returns_participants(client):
    response = client.get("/activities")

    assert response.status_code == 200
    activities = response.json()
    assert activities["Chess Club"]["participants"] == ["existing@mergington.edu"]
    assert activities["Art Club"]["participants"] == []


def test_signup_adds_participant(client):
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": "new@mergington.edu"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Signed up new@mergington.edu for Chess Club"
    }
    participants = client.get("/activities").json()["Chess Club"]["participants"]
    assert "new@mergington.edu" in participants


def test_signup_rejects_duplicate_participant(client):
    response = client.post(
        "/activities/Chess Club/signup",
        params={"email": "existing@mergington.edu"},
    )

    assert response.status_code == 400
    assert client.get("/activities").json()["Chess Club"]["participants"] == [
        "existing@mergington.edu"
    ]


def test_signup_rejects_unknown_activity(client):
    response = client.post(
        "/activities/Unknown Club/signup",
        params={"email": "new@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_removes_participant(client):
    response = client.delete(
        "/activities/Chess Club/participants",
        params={"email": "existing@mergington.edu"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Removed existing@mergington.edu from Chess Club"
    }
    assert client.get("/activities").json()["Chess Club"]["participants"] == []


def test_unregister_rejects_missing_participant(client):
    response = client.delete(
        "/activities/Chess Club/participants",
        params={"email": "missing@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Student not signed up for this activity"
    assert client.get("/activities").json()["Chess Club"]["participants"] == [
        "existing@mergington.edu"
    ]


def test_unregister_rejects_unknown_activity(client):
    response = client.delete(
        "/activities/Unknown Club/participants",
        params={"email": "existing@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
