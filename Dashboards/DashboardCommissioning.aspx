<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="DashboardCommissioning.aspx.cs" Inherits="PHX_MEERA.DashboardCommissioning" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head runat="server">
    <title>Parking Management System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        
        .parking-row {
            display: flex;
            margin-bottom: 20px;
            gap: 10px;
        }
        
        .parking-space {
            flex: 1;
            border: 2px solid #ddd;
            background-color: white;
            min-height: 200px;
            display: flex;
            flex-direction: column;
        }
        
        .space-divider {
            background-color: #4a6fa5;
            color: white;
            padding: 5px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            border: 1px solid #3a5a85;
        }
        
        .space-content {
            flex: 1;
            padding: 10px;
            background-color: #fff;
        }
        
        .space-info {
            background-color: #4a6fa5;
            color: white;
            padding: 8px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
        }
        
        .status-button {
            color: white;
            border: none;
            padding: 10px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            text-align: center;
        }
        
        .status-button.not-ready {
            background-color: #dc3545;
        }
        
        .status-button.ready {
            background-color: #28a745;
        }
        
        .status-button.empty {
            background-color: #ffffff;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .car-display {
            padding: 20px;
        }
        
        .progress-container {
            background-color: #e0e0e0;
            border-radius: 10px;
            height: 30px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-bar {
            height: 100%;
            background-color: #4a6fa5;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            transition: width 0.3s ease;
        }
        
        .completion-time {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #28a745;
            padding: 20px;
        }
        
        .station-label {
            display: inline-block;
            padding: 2px 4px;
        }
        
        .station-active {
            background-color: #ffc107;
            color: #000;
            font-weight: bold;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <div class="header">
            <h2>Parking Management System</h2>
        </div>
        
        <!-- First Row of Parking Spaces -->
        <div class="parking-row">
            <asp:Panel ID="Panel1" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-9:
                </div>
                <asp:Button ID="btnStatus1" runat="server" CssClass="status-button empty" Text="No Car" />
            </asp:Panel>
            
            <asp:Panel ID="Panel2" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-8:
                </div>
                <asp:Button ID="btnStatus2" runat="server" CssClass="status-button ready" Text="Ready for GA" />
            </asp:Panel>
            
            <asp:Panel ID="Panel3" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-7:
                </div>
                <asp:Button ID="btnStatus3" runat="server" CssClass="status-button empty" Text="No Car" />
            </asp:Panel>
            
            <asp:Panel ID="Panel4" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-6:
                </div>
                <asp:Button ID="btnStatus4" runat="server" CssClass="status-button not-ready" Text="Not Ready" />
            </asp:Panel>
            
            <asp:Panel ID="Panel5" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-5:
                </div>
                <asp:Button ID="btnStatus5" runat="server" CssClass="status-button empty" Text="No Car" />
            </asp:Panel>
        </div>
        
        <!-- Second Row of Parking Spaces -->
        <div class="parking-row">
            <asp:Panel ID="Panel6" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-4:
                </div>
                <asp:Button ID="btnStatus6" runat="server" CssClass="status-button not-ready" Text="Not Ready" />
            </asp:Panel>

            <asp:Panel ID="Panel7" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-3:
                </div>
                <asp:Button ID="btnStatus7" runat="server" CssClass="status-button empty" Text="No Car" />
            </asp:Panel>
            
            <asp:Panel ID="Panel8" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-2:
                </div>
                <asp:Button ID="btnStatus8" runat="server" CssClass="status-button empty" Text="No Car" />
            </asp:Panel>
            
            <asp:Panel ID="Panel9" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-1:
                </div>
                <asp:Button ID="btnStatus9" runat="server" CssClass="status-button not-ready" Text="Not Ready" />
            </asp:Panel>
            
            <asp:Panel ID="Panel10" runat="server" CssClass="parking-space">
                <div class="space-divider">--:--</div>
                <div class="space-content" runat="server"></div>
                <div class="space-info" runat="server">
                    EO-1&nbsp;&nbsp;&nbsp;&nbsp;VB-1&nbsp;&nbsp;&nbsp;&nbsp;LF-1&nbsp;&nbsp;&nbsp;&nbsp;CA-1<br/>
                    WAC01-A1-0:
                </div>
                <asp:Button ID="btnStatus10" runat="server" CssClass="status-button empty" Text="No Car" />
            </asp:Panel>
        </div>
    </form>
</body>
</html>