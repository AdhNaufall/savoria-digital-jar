<?php
header('Content-Type: application/json');

// Mengizinkan akses (CORS) agar tidak diblokir browser
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$db_file = 'database.json';

// Cek jika file database belum ada, buat baru
if (!file_exists($db_file)) {
    file_put_contents($db_file, '[]');
}

// Menangani request GET (mengambil data dari toples)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = file_get_contents($db_file);
    echo $data;
    exit;
}

// Menangani request POST (menyimpan data ke toples)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $new_memories = json_decode($input, true);
    
    if ($new_memories !== null) {
        // Simpan dalam format rapi (JSON_PRETTY_PRINT) agar mudah dibaca manusia
        file_put_contents($db_file, json_encode($new_memories, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success', 'message' => 'Data berhasil disimpan']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Data tidak valid']);
    }
    exit;
}
?>
