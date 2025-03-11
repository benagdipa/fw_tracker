<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>WNTD Export</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            background-color: #f3f4f6;
            padding: 8px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 8px;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 4px;
            text-align: left;
        }
        th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 8px;
            color: #6b7280;
            padding: 10px 0;
        }
        .page-break {
            page-break-after: always;
        }
        .status {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            display: inline-block;
        }
        .status-active {
            background-color: #dcfce7;
            color: #166534;
        }
        .status-inactive {
            background-color: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>WNTD Export</h1>
        <p>Generated on: {{ $exportDate }}</p>
    </div>

    <div class="section">
        <div class="section-title">WNTD Data</div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Site Name</th>
                    <th>Location ID</th>
                    <th>WNTD</th>
                    <th>IMSI</th>
                    <th>Version</th>
                    <th>AVC</th>
                    <th>BW Profile</th>
                    <th>Home Cell</th>
                    <th>Home PCI</th>
                    <th>Traffic Profile</th>
                    <th>Location</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($wntdData as $wntd)
                <tr>
                    <td>{{ $wntd->id }}</td>
                    <td>{{ $wntd->site_name }}</td>
                    <td>{{ $wntd->loc_id }}</td>
                    <td>{{ $wntd->wntd }}</td>
                    <td>{{ $wntd->imsi }}</td>
                    <td>{{ $wntd->version }}</td>
                    <td>{{ $wntd->avc }}</td>
                    <td>{{ $wntd->bw_profile }}</td>
                    <td>{{ $wntd->home_cell }}</td>
                    <td>{{ $wntd->home_pci }}</td>
                    <td>{{ $wntd->traffic_profile }}</td>
                    <td>{{ $wntd->lon }}, {{ $wntd->lat }}</td>
                    <td>
                        <div class="status status-{{ $wntd->status === 'active' ? 'active' : 'inactive' }}">
                            {{ $wntd->status }}
                        </div>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <div class="section-title">Timeline Events</div>
        <table>
            <thead>
                <tr>
                    <th>WNTD ID</th>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                @foreach($wntdData as $wntd)
                    @foreach($wntd->timeline as $event)
                    <tr>
                        <td>{{ $wntd->id }}</td>
                        <td>{{ $event->event }}</td>
                        <td>{{ $event->date }}</td>
                        <td>{{ $event->description }}</td>
                    </tr>
                    @endforeach
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <div class="section-title">Change History</div>
        <table>
            <thead>
                <tr>
                    <th>WNTD ID</th>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Changed At</th>
                    <th>Changed By</th>
                </tr>
            </thead>
            <tbody>
                @foreach($wntdData as $wntd)
                    @foreach($wntd->history as $history)
                    <tr>
                        <td>{{ $wntd->id }}</td>
                        <td>{{ $history->field }}</td>
                        <td>{{ $history->old_value }}</td>
                        <td>{{ $history->new_value }}</td>
                        <td>{{ $history->created_at }}</td>
                        <td>{{ $history->user_id }}</td>
                    </tr>
                    @endforeach
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>WNTD Export - Page {PAGENO}</p>
    </div>
</body>
</html> 