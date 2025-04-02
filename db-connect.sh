#!/bin/bash
# Script to connect to the database or run queries

# Function to show help
show_help() {
  echo "Database Connection Utility"
  echo ""
  echo "Usage:"
  echo "  ./db-connect.sh [command]"
  echo ""
  echo "Commands:"
  echo "  connect        - Connect to the interactive psql shell"
  echo "  query \"SQL\"    - Run a specific SQL query"
  echo "  users          - List all users"
  echo "  drivers        - List all drivers"
  echo "  fleet-owners   - List all fleet owners"
  echo "  jobs           - List all jobs"
  echo "  help           - Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./db-connect.sh connect"
  echo "  ./db-connect.sh query \"SELECT * FROM users;\""
  echo "  ./db-connect.sh users"
}

# Check if a command was provided
if [ -z "$1" ]; then
  show_help
  exit 1
fi

# Process the command
case "$1" in
  connect)
    echo "Connecting to database..."
    PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE
    ;;
    
  query)
    if [ -z "$2" ]; then
      echo "Error: SQL query required"
      exit 1
    fi
    echo "Running query: $2"
    echo "$2" | PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE
    ;;
    
  users)
    echo "Fetching all users..."
    echo "SELECT * FROM users;" | PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE
    ;;
    
  drivers)
    echo "Fetching all drivers..."
    echo "SELECT * FROM drivers;" | PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE
    ;;
    
  fleet-owners)
    echo "Fetching all fleet owners..."
    echo "SELECT * FROM fleet_owners;" | PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE
    ;;
    
  jobs)
    echo "Fetching all jobs..."
    echo "SELECT * FROM jobs;" | PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -d $PGDATABASE
    ;;
    
  help|*)
    show_help
    ;;
esac