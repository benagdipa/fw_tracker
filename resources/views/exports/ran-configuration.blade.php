<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>RAN Configuration Export</title>
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
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 6px;
            text-align: left;
            font-size: 9px;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>RAN Configuration Export</h1>
        <p>Generated on: {{ $exportDate }}</p>
    </div>

    <div class="section">
        <div class="section-title">Struct Parameters</div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Parameter Name</th>
                    <th>Description</th>
                    <th>Data Type</th>
                    <th>Value Range</th>
                    <th>Default Value</th>
                    <th>Unit</th>
                    <th>Technology</th>
                    <th>Vendor</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($structParameters as $param)
                <tr>
                    <td>{{ $param->id }}</td>
                    <td>{{ $param->parameter_name }}</td>
                    <td>{{ $param->description }}</td>
                    <td>{{ $param->data_type }}</td>
                    <td>{{ $param->value_range }}</td>
                    <td>{{ $param->default_value }}</td>
                    <td>{{ $param->unit }}</td>
                    <td>{{ $param->technology }}</td>
                    <td>{{ $param->vendor }}</td>
                    <td>{{ $param->status }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <div class="section-title">Parameters</div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Parameter Name</th>
                    <th>Description</th>
                    <th>Data Type</th>
                    <th>Value Range</th>
                    <th>Default Value</th>
                    <th>Unit</th>
                    <th>Technology</th>
                    <th>Vendor</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($parameters as $param)
                <tr>
                    <td>{{ $param->id }}</td>
                    <td>{{ $param->parameter_name }}</td>
                    <td>{{ $param->description }}</td>
                    <td>{{ $param->data_type }}</td>
                    <td>{{ $param->value_range }}</td>
                    <td>{{ $param->default_value }}</td>
                    <td>{{ $param->unit }}</td>
                    <td>{{ $param->technology }}</td>
                    <td>{{ $param->vendor }}</td>
                    <td>{{ $param->status }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>RAN Configuration Export - Page {PAGENO}</p>
    </div>
</body>
</html> 