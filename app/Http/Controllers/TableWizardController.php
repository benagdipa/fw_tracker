<?php

namespace App\Http\Controllers;


use App\Models\Attribute;
use App\Models\Entity;
use App\Models\Value;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Rules\LowercaseWithUnderscore;
use Illuminate\Support\Facades\Validator;
use League\Csv\Reader;
use Illuminate\Support\Facades\DB;


class TableWizardController extends Controller
{
    public function index()
    {
        return Inertia::render('TableWizard/Index');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', new LowercaseWithUnderscore, 'string', 'unique:' . Entity::class],
        ]);

        $item = Entity::create([
            'title' => $request->title,
            'slug' => str_replace(' ', '_', strtolower($request->slug)),
            'user_id' => Auth::id(),
        ]);
        if ($item) {
            return to_route('table.wizard.column.index', $item->id);
        }
    }

    public function column_index($id)
    {
        $table = Entity::findOrFail($id);
        return Inertia::render('TableWizard/ColumnIndex', [
            'table' => $table
        ]);
    }

    public function column_store(Request $request)
    {
        $request->validate([
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.slug' => ['required', new LowercaseWithUnderscore, 'unique:' . Attribute::class],
            'items.*.input_type' => ['required_if:items.*.editable,true'],
            'items.*.options' => ['required_if:items.*.input_type,dropdown'],
        ], [
            'items.*.name.required' => 'The name field is required.',
            'items.*.slug.required' => 'The slug field is required.',
            'items.*.slug.unique' => 'The slug field must be unique.',
            'items.*.input_type.required_if' => 'This field is required.',
            'items.*.options.required_if' => 'This field is required.',
        ]);
        foreach ($request->items as $item) {
            Attribute::create([
                'entity_id' => $request->table_id,
                'name' => $item['name'],
                'slug' => $item['slug'],
                'type' => 'main',
                'sortable' => $item['sortable'],
                'position' => $item['position'],
                'editable' => $item['editable'],
                'input_type' => $item['input_type'],
                'input_options' => $item['options'] ? json_encode(explode('|', $item['options'])) : null,
                'user_id' => Auth::id(),
            ]);
        }

        return to_route('view.table.item', $request->table_slug);
    }

    public function view_table_item($slug)
    {
        $table = Entity::with([
            'attributes' => function ($query) {
                $query->orderBy('position', 'asc');
            },
            'values' => function ($query) {
                $query->orderBy('id', 'DESC')
                    ->select('id', 'entity_id', 'values');
            }
        ])->where('slug', $slug)->firstOrFail();
        $perPage = 10;
        $paginatedValues = $table->values()->paginate($perPage);
        $table->setRelation('values', $paginatedValues);
        return Inertia::render('TableWizard/ViewTableItem', [
            'entity' => $table
        ]);
    }

    public function import_from_csv(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'import_file' => 'required|file|mimes:csv,txt',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => array('message' => $validator->errors()->first())], 500);
        }
        $file = $request->file('import_file');
        $filePath = $file->storeAs('import', now()->timestamp . "_{$file->getClientOriginalName()}");
        $csv = Reader::createFromPath(storage_path('app/' . $filePath), 'r');
        $csv->setHeaderOffset(0);
        $header = $csv->getHeader();
        return response()->json([
            'filePath' => $filePath,
            'header' => $header
        ], 200);
    }

    public function map_and_save_csv(Request $request)
    {
        $filePath = $request->input('file_path');
        $inputColumns = $request->all();
        $csv = Reader::createFromPath(storage_path('app/' . $filePath), 'r');
        $csv->setHeaderOffset(0);
        $rows = $csv->getRecords();
        foreach ($rows as $rowKey => $row) {
            $rowItem = [];
            foreach ($inputColumns as $columnKey => $column) {
                foreach ($row as $key => $value) {
                    if ($key === $column) {
                        $rowItem[] = array($columnKey => $value);
                    }
                }
            }
            Value::create([
                'entity_id' => $request->input('entity_id'),
                'values' => json_encode(array_values($rowItem)),
            ]);
        }
        return response()->json([
            'success' => ['message' => 'Data imported successfully.'],
        ], 200);
    }

    public function add_column(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', new LowercaseWithUnderscore, 'string', 'unique:' . Attribute::class],
            'input_type' => ['required_if:editable,true'],
            'options' => ['required_if:input_type,dropdown'],
        ]);
        $attributesCount = Attribute::where('entity_id', $request->entity_id)->count();
        $attribue = Attribute::create([
            'entity_id' => $request->entity_id,
            'name' => $request->name,
            'slug' => $request->slug,
            'type' => 'additional',
            'sortable' => $request->sortable,
            'position' => $attributesCount + 1,
            'editable' => $request->editable,
            'input_type' => $request->input_type,
            'input_options' => json_encode($request->options),
            'user_id' => Auth::id(),
        ]);
    }

    public function hide_column(Request $request)
    {
        $items = $request->items;
        $unHiddenItems = $request->unHiddenItems;

        if (count($items) > 0) {
            foreach ($items as $item) {
                $arrtibute = Attribute::where('id', $item)->first();
                $arrtibute->hidden = true;
                $arrtibute->update();
            }
        }
        if (count($unHiddenItems) > 0) {
            foreach ($unHiddenItems as $unHiddenItem) {
                $arrtibute = Attribute::where('id', $unHiddenItem)->first();
                $arrtibute->hidden = false;
                $arrtibute->update();
            }
        }
    }

    public function rename_column(Request $request)
    {
        $items = $request->items;
        if (is_array($items)) {
            foreach ($items as $item) {
                $arrtibute = Attribute::where('id', $item['id'])->first();
                $arrtibute->alternative_name = $item['name'];
                $arrtibute->update();
            }
        }
    }

    public function delete_column(Request $request)
    {
        $items = $request->items;
        if (is_array($items)) {
            foreach ($items as $item) {
                $arrtibute = Attribute::where('id', $item)->first();
                $arrtibute->delete();
            }
        }
    }

    public function upload_artifacts(Request $request)
    {
        $paths_array = [];
        if ($request->hasFile('artifacts')) {
            $files = $request->file('artifacts');
            foreach ($files as $file) {
                $name = now()->timestamp . "_{$file->getClientOriginalName()}";
                $path = $file->storeAs('artifacts', $name, 'public');
                $paths_array[] = "/storage/{$path}";
            }
        }
        if (count($paths_array) > 0) {
            $item = Value::findOrFail($request->columnId);
            $values = json_decode($item->values);
            foreach ($values as $key => $value) {
                if (isset($value->{$request->headerSlug})) {
                    $value->{$request->headerSlug} = json_encode($paths_array);
                }
            }
            $item->values = json_encode($values);
            $item->save();
        }
    }

    public function save_row(Request $request, $id)
	{
		try {
        $item = Value::findOrFail($id);

        if ($item) {
            $values = $request->changedItems;
            if (is_array($values)) {
                $item->values = json_encode($values); 
                $item->updated_at = now();
                $item->save();

                // Return a response indicating success
                return response()->json([
                    'success' => true,
                    'savedData' => $item // You can return the saved data
                ]);
            } else {
                return response()->json(['success' => false, 'error' => 'Invalid data format']);
            }
        }
			
			return response()->json(['success' => false, 'error' => 'Item not found']);
		} catch (\Exception $e) {
			return response()->json(['success' => false, 'error' => $e->getMessage()]);
		}

	}

    public function add_row(Request $request)
{
    // Ensure the required fields are present
    if ($request->has('entity_id') && $request->has('newItem')) {
        $entity_id = $request->input('entity_id');
        $newItem = $request->input('newItem');  // This will be the flat array

        // Prepare the data for insertion (each item should be a key-value pair)
        $toInsert = [];
        foreach ($newItem as $item) {
            // Merge the item with the entity_id (which won't be included in each individual object)
            $toInsert[] = $item;
        }

        // Insert into the database (without the 'id' field, as it's auto-incremented)
        $item = Value::create([
            'entity_id' => $entity_id,  // The entity ID
            'values' => json_encode($toInsert),  // Insert the values as JSON
        ]);

        // Return the newly inserted row including the auto-generated 'id'
        return response()->json([
            'success' => true,
            'newRow' => $item,  // This includes the auto-generated 'id'
        ]);
    }

    return response()->json(['success' => false, 'message' => 'Invalid data.']);
}



    public function delete_row($id)
    {
        $value = Value::findOrFail($id);
        $value->delete();
		// Return a success response
        return response()->json(['success' => true]);
    }

    public function rearrange_column(Request $request)
    {
        $items = $request->items;
        if (is_array($items)) {
            foreach ($items as $item) {
                $arrtibute = Attribute::where('slug', $item['slug'])->first();
                $arrtibute->position = $item['position'];
                $arrtibute->update();
            }
        }
    }

    public function restore_column(Request $request)
    {
        // $entity_id = $request->entity_id;
        // $attributes = Attribute::where('entity_id', $entity_id)->get();
        // foreach ($attributes as $attribute) {
        //     $attribute->hidden = false;
        //     $attribute->alternative_name = null;
        //     $attribute->update();
        // }
    }

    // public function export_column($id)
    // {
    //     dd($id);
    // }

    public function delete_table($id)
    {
        $entity = Entity::findOrFail($id);
        $entity->delete();
        return to_route('dashboard');
    }
}
