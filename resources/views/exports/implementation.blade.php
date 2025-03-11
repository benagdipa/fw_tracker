<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Implementation Export</title>
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
        .status-completed {
            background-color: #dcfce7;
            color: #166534;
        }
        .status-in-progress {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-pending {
            background-color: #fef9c3;
            color: #854d0e;
        }
        .priority-high {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .priority-medium {
            background-color: #fef9c3;
            color: #854d0e;
        }
        .priority-low {
            background-color: #dcfce7;
            color: #166534;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Implementation Tracker Export</h1>
        <p>Generated on: {{ $exportDate }}</p>
    </div>

    <div class="section">
        <div class="section-title">Implementation Data</div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Site Name</th>
                    <th>Project Name</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Progress</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Assigned To</th>
                </tr>
            </thead>
            <tbody>
                @foreach($implementationData as $implementation)
                <tr>
                    <td>{{ $implementation->id }}</td>
                    <td>{{ $implementation->site_name }}</td>
                    <td>{{ $implementation->project_name }}</td>
                    <td>
                        <div class="status status-{{ strtolower(str_replace(' ', '-', $implementation->status)) }}">
                            {{ $implementation->status }}
                        </div>
                    </td>
                    <td>
                        <div class="priority-{{ strtolower($implementation->priority) }}">
                            {{ $implementation->priority }}
                        </div>
                    </td>
                    <td>{{ $implementation->progress }}%</td>
                    <td>{{ $implementation->start_date }}</td>
                    <td>{{ $implementation->end_date }}</td>
                    <td>{{ $implementation->assigned_to }}</td>
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
                    <th>Implementation ID</th>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                @foreach($implementationData as $implementation)
                    @foreach($implementation->timeline as $event)
                    <tr>
                        <td>{{ $implementation->id }}</td>
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
                    <th>Implementation ID</th>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Changed At</th>
                    <th>Changed By</th>
                </tr>
            </thead>
            <tbody>
                @foreach($implementationData as $implementation)
                    @foreach($implementation->history as $history)
                    <tr>
                        <td>{{ $implementation->id }}</td>
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
        <p>Implementation Tracker Export - Page {PAGENO}</p>
    </div>
</body>
</html> 