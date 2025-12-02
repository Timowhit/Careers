using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace PHX_MEERA
{
    public partial class DashboardCommissioning : System.Web.UI.Page
    {
        // Station definitions in sequential order
        private static readonly string[] Stations = { "EO-1", "VB-1", "LF-1", "CA-1" };
        private static readonly Dictionary<string, string> StationDisplayNames = new Dictionary<string, string>
        {
            { "EO-1", "EOL" },
            { "VB-1", "VBU" },
            { "LF-1", "LFT" },
            { "CA-1", "CAL" }
        };

        // Simulated car data
        [Serializable]
        private class CarData
        {
            public bool HasCar { get; set; }
            public string CurrentStation { get; set; }
            public int StationIndex { get; set; }
            public int Progress { get; set; }
            public bool IsCompleted { get; set; }
            public DateTime? CompletionTime { get; set; }
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            // Enable auto-refresh every 3 seconds
            Response.AddHeader("Refresh", "3");

            GenerateSimulatedData();
        }

        private Dictionary<string, CarData> GetCarStates()
        {
            if (Session["CarStates"] == null)
            {
                Session["CarStates"] = new Dictionary<string, CarData>();
            }
            return (Dictionary<string, CarData>)Session["CarStates"];
        }

        private DateTime GetLastUpdate()
        {
            if (Session["LastUpdate"] == null)
            {
                Session["LastUpdate"] = DateTime.MinValue;
            }
            return (DateTime)Session["LastUpdate"];
        }

        private void SetLastUpdate(DateTime value)
        {
            Session["LastUpdate"] = value;
        }

        private void GenerateSimulatedData()
        {
            Random rand = new Random();
            var carStates = GetCarStates();
            var lastUpdate = GetLastUpdate();

            // Initialize states if first run or reset after 5 minutes
            if (lastUpdate == DateTime.MinValue || (DateTime.Now - lastUpdate).TotalMinutes > 5)
            {
                InitializeCarStates(rand, carStates);
                SetLastUpdate(DateTime.Now);
            }
            else
            {
                // Update existing car states to simulate progression
                UpdateCarStates(rand, carStates);
                SetLastUpdate(DateTime.Now);
            }

            // Define parking panels and their corresponding controls
            var parkingSpaces = new[]
            {
                new { Panel = Panel1, Button = btnStatus1, SpaceId = "WAC01-A1-9" },
                new { Panel = Panel2, Button = btnStatus2, SpaceId = "WAC01-A1-8" },
                new { Panel = Panel3, Button = btnStatus3, SpaceId = "WAC01-A1-7" },
                new { Panel = Panel4, Button = btnStatus4, SpaceId = "WAC01-A1-6" },
                new { Panel = Panel5, Button = btnStatus5, SpaceId = "WAC01-A1-5" },
                new { Panel = Panel6, Button = btnStatus6, SpaceId = "WAC01-A1-4" },
                new { Panel = Panel7, Button = btnStatus7, SpaceId = "WAC01-A1-3" },
                new { Panel = Panel8, Button = btnStatus8, SpaceId = "WAC01-A1-2" },
                new { Panel = Panel9, Button = btnStatus9, SpaceId = "WAC01-A1-1" },
                new { Panel = Panel10, Button = btnStatus10, SpaceId = "WAC01-A1-0" }
            };

            foreach (var space in parkingSpaces)
            {
                if (!carStates.ContainsKey(space.SpaceId))
                {
                    carStates[space.SpaceId] = new CarData { HasCar = false };
                }

                UpdateParkingSpace(space.Panel, space.Button, carStates[space.SpaceId], space.SpaceId);
            }
        }

        private void InitializeCarStates(Random rand, Dictionary<string, CarData> carStates)
        {
            carStates.Clear();

            var spaceIds = new[] { "WAC01-A1-9", "WAC01-A1-8", "WAC01-A1-7", "WAC01-A1-6",
                                   "WAC01-A1-5", "WAC01-A1-4", "WAC01-A1-3", "WAC01-A1-2",
                                   "WAC01-A1-1", "WAC01-A1-0" };

            foreach (string spaceId in spaceIds)
            {
                int scenario = rand.Next(0, 100);

                if (scenario < 35) // 35% empty
                {
                    carStates[spaceId] = new CarData { HasCar = false };
                }
                else if (scenario < 55) // 20% completed
                {
                    int hoursAgo = rand.Next(0, 4);
                    int minutesAgo = rand.Next(0, 60);
                    carStates[spaceId] = new CarData
                    {
                        HasCar = true,
                        IsCompleted = true,
                        CompletionTime = DateTime.Now.AddHours(-hoursAgo).AddMinutes(-minutesAgo)
                    };
                }
                else // 45% in progress
                {
                    int stationIndex = rand.Next(0, Stations.Length);
                    int progress = rand.Next(15, 85);

                    carStates[spaceId] = new CarData
                    {
                        HasCar = true,
                        IsCompleted = false,
                        CurrentStation = Stations[stationIndex],
                        StationIndex = stationIndex,
                        Progress = progress
                    };
                }
            }
        }

        private void UpdateCarStates(Random rand, Dictionary<string, CarData> carStates)
        {
            foreach (var kvp in carStates.ToList())
            {
                CarData car = kvp.Value;

                if (!car.HasCar || car.IsCompleted)
                {
                    // Add new cars to empty spaces (10% chance)
                    if (!car.HasCar && rand.Next(0, 100) < 10)
                    {
                        car.HasCar = true;
                        car.IsCompleted = false;
                        car.CurrentStation = Stations[0];
                        car.StationIndex = 0;
                        car.Progress = rand.Next(5, 15);
                    }

                    // Remove completed cars (5% chance)
                    if (car.IsCompleted && rand.Next(0, 100) < 5)
                    {
                        car.HasCar = false;
                        car.IsCompleted = false;
                        car.CompletionTime = null;
                    }
                }
                else
                {
                    // Car is in progress - advance progress
                    int progressIncrement = rand.Next(3, 9);
                    car.Progress = Math.Min(100, car.Progress + progressIncrement);

                    // Check if station is complete
                    if (car.Progress >= 100)
                    {
                        if (car.StationIndex < Stations.Length - 1)
                        {
                            // Move to next station
                            car.StationIndex++;
                            car.CurrentStation = Stations[car.StationIndex];
                            car.Progress = rand.Next(5, 15);
                        }
                        else
                        {
                            // All stations complete
                            car.IsCompleted = true;
                            car.CompletionTime = DateTime.Now;
                            car.CurrentStation = null;
                            car.Progress = 0;
                        }
                    }
                }

                carStates[kvp.Key] = car;
            }
        }

        private void UpdateParkingSpace(Panel panel, Button button, CarData carData, string spaceId)
        {
            // Find the space-content and space-info divs
            System.Web.UI.HtmlControls.HtmlGenericControl contentDiv = null;
            System.Web.UI.HtmlControls.HtmlGenericControl infoDiv = null;

            foreach (Control ctrl in panel.Controls)
            {
                if (ctrl is System.Web.UI.HtmlControls.HtmlGenericControl div)
                {
                    if (div.Attributes["class"] == "space-content")
                        contentDiv = div;
                    else if (div.Attributes["class"] == "space-info")
                        infoDiv = div;
                }
            }

            if (!carData.HasCar)
            {
                // No car - empty station
                button.CssClass = "status-button empty";
                button.Text = "No Car";

                if (contentDiv != null)
                    contentDiv.InnerHtml = "";

                if (infoDiv != null)
                    infoDiv.InnerHtml = BuildStationInfo(null, spaceId);
            }
            else if (carData.IsCompleted)
            {
                // Completed car
                button.CssClass = "status-button ready";
                button.Text = "Ready for GA";

                if (contentDiv != null)
                {
                    contentDiv.InnerHtml = $@"
                        <div class='car-display'>
                            <div class='completion-time'>Completed: {carData.CompletionTime:hh:mm tt}</div>
                        </div>";
                }

                if (infoDiv != null)
                    infoDiv.InnerHtml = BuildStationInfo(null, spaceId);
            }
            else
            {
                // In progress
                button.CssClass = "status-button not-ready";
                button.Text = "Not Ready";

                string stationDisplayName = StationDisplayNames[carData.CurrentStation];

                if (contentDiv != null)
                {
                    contentDiv.InnerHtml = $@"
                        <div class='car-display'>
                            <div style='font-size: 14px; margin-bottom: 5px; color: #666;'>Current Station: {stationDisplayName}</div>
                            <div class='progress-container'>
                                <div class='progress-bar' style='width: {carData.Progress}%;'>{carData.Progress}%</div>
                            </div>
                        </div>";
                }

                if (infoDiv != null)
                    infoDiv.InnerHtml = BuildStationInfo(carData.CurrentStation, spaceId);
            }
        }

        private string BuildStationInfo(string activeStation, string spaceId)
        {
            string stationHtml = "";
            foreach (string station in Stations)
            {
                if (station == activeStation)
                {
                    stationHtml += $"<span class='station-label station-active'>{station}</span>&nbsp;&nbsp;&nbsp;&nbsp;";
                }
                else
                {
                    stationHtml += $"<span class='station-label'>{station}</span>&nbsp;&nbsp;&nbsp;&nbsp;";
                }
            }

            return $"{stationHtml}<br/>{spaceId}:";
        }
    }
}