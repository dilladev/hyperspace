# Hyperspace - a space for your links

Hyperspace is a lightweight, intuitive tool for organizing and displaying your favorite links in a clean, customizable space. You can create multiple groups, each containing a curated set of links — complete with icons, titles, and metadata for quick reference.

Designed with flexibility in mind, Hyperspace lets you easily manage and reorder your content using drag-and-drop interactions. Whether you're building a personal dashboard, sharing resources, or managing project references, Hyperspace gives you a simple yet powerful way to keep everything connected in one place.



## ✨ Features

- 🗂️ Organize links into custom groups
- 🔗 Add icons, metadata, and descriptions
- 🔄 Drag-and-drop reordering
- 💾 Data persistence with PostgreSQL
- ⚡ Fast, responsive UI
- 🛠️ Fully self-hosted

---

## 🚀 Getting Started

This guide helps you install Docker and run Hyperspace using Docker Compose.

---

### ✅ Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

### 🐳 Install Docker & Docker Compose

#### Ubuntu / Debian:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose

```
### 📦 Install & Run Hyperspace
Step 1: Create a Folder for Hyperspace
```
mkdir hyperspace
cd hyperspace
```

Step 2: Create a docker-compose.yml File
Create a new file named docker-compose.yml and paste the contents on docker-compose.yml found in the repository

Step 3: Start the App
Run the following command from the same directory as your docker-compose.yml:
```
docker compose up -d
```
This command will download the necessary Docker images and start all the services (frontend, backend, and database).

### 🌐 Access Hyperspace
Once the app is running, you can access it in your browser:

- Frontend UI: http://localhost:3002
- Backend API (optional): http://localhost:3003

### 🛑 Stopping the App
To stop the app without removing your data:
```
docker compose down
```

To stop the app and remove all data (including uploads and the database):
```
docker compose down -v
```

### 📂 Data & Storage
- Uploaded files are stored in the ./uploads folder on your host machine.
- PostgreSQL data is stored in a Docker-managed volume named db_data.

### 📣 Contributing / Feedback
We welcome contributions, bug reports, and feature requests!
Feel free to open an issue or pull request on the repository.

Made with ❤️ by the Hyperspace team
