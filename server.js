const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// =====================================================
// MYSQL CONNECTION
// =====================================================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL connection failed:", err.message);
        return;
    }

    console.log("✅ Connected to MachOptDB");
});


// =====================================================
// TEST API
// =====================================================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "MachOpt backend is running!"
    });
});


// =====================================================
// EXPERIMENTS
// =====================================================

app.get("/api/experiments", (req, res) => {

    const sql = `
        SELECT
            e.Experiment_ID,
            e.workpiece_ID,
            e.Tool_ID,
            e.machine_ID,
            e.operator_ID,
            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time,
            r.Tool_Wear_mm,
            r.Surface_Roughness_Ra,
            r.Material_Removal_Rate,
            en.Energy_Consumed_kWh,
            c.Total_Cost
        FROM machining_experiment e
        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN machining_cost c
            ON e.Experiment_ID = c.Experiment_ID
        ORDER BY e.Experiment_ID;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Experiments query failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
});


// =====================================================
// DASHBOARD KPI
// =====================================================

app.get("/api/dashboard", (req, res) => {

    const sql = `
        SELECT
            COUNT(DISTINCT e.Experiment_ID) AS total_experiments,

            ROUND(AVG(r.Tool_Wear_mm), 3) AS avg_tool_wear,

            ROUND(AVG(r.Surface_Roughness_Ra), 2) AS avg_surface_roughness,

            ROUND(AVG(r.Material_Removal_Rate), 2) AS avg_mrr,

            ROUND(AVG(en.Energy_Consumed_kWh), 2) AS avg_energy,

            ROUND(AVG(c.Total_Cost), 2) AS avg_cost

        FROM machining_experiment e

        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID

        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID

        JOIN machining_cost c
            ON e.Experiment_ID = c.Experiment_ID;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Dashboard query failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
});


// =====================================================
// RESULTS
// =====================================================

app.get("/api/results", (req, res) => {

    const sql = `
        SELECT
            r.*,
            e.workpiece_ID,
            e.Tool_ID,
            e.machine_ID,
            e.operator_ID,
            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time
        FROM machining_result r
        JOIN machining_experiment e
            ON r.Experiment_ID = e.Experiment_ID
        ORDER BY r.Experiment_ID;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Results query failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
});


// =====================================================
// ENERGY
// =====================================================

app.get("/api/energy", (req, res) => {

    const sql = `
        SELECT
            en.*,
            e.workpiece_ID,
            e.Tool_ID,
            e.machine_ID,
            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time
        FROM energy_consumption en
        JOIN machining_experiment e
            ON en.Experiment_ID = e.Experiment_ID
        ORDER BY en.Experiment_ID;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Energy query failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
});


// =====================================================
// COST
// =====================================================

app.get("/api/cost", (req, res) => {

    const sql = `
        SELECT
            c.*,
            e.workpiece_ID,
            e.Tool_ID,
            e.machine_ID,
            e.operator_ID,
            e.Machining_Time
        FROM machining_cost c
        JOIN machining_experiment e
            ON c.Experiment_ID = e.Experiment_ID
        ORDER BY c.Experiment_ID;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Cost query failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
});


// =====================================================
// workpieceS
// =====================================================

app.get("/api/workpieces", (req, res) => {

    db.query(
        "SELECT * FROM workpiece ORDER BY workpiece_ID",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                count: results.length,
                data: results
            });
        }
    );
});


// =====================================================
// CUTTING TOOLS
// =====================================================

app.get("/api/tools", (req, res) => {

    db.query(
        "SELECT * FROM cutting_tool ORDER BY Tool_ID",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                count: results.length,
                data: results
            });
        }
    );
});


// =====================================================
// machineS
// =====================================================

app.get("/api/machines", (req, res) => {

    db.query(
        "SELECT * FROM machine ORDER BY machine_ID",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                count: results.length,
                data: results
            });
        }
    );
});


// =====================================================
// operatorS
// =====================================================

app.get("/api/operators", (req, res) => {

    db.query(
        "SELECT * FROM operator ORDER BY operator_ID",
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                count: results.length,
                data: results
            });
        }
    );
});


// =====================================================
// TOOL PERFORMANCE
// =====================================================

app.get("/api/tool-performance", (req, res) => {

    const sql = `
        SELECT
            t.Tool_ID,
            t.Tool_Material,
            ROUND(AVG(r.Tool_Wear_mm), 3) AS Average_Tool_Wear,
            ROUND(AVG(r.Surface_Roughness_Ra), 2) AS Average_Roughness,
            ROUND(AVG(r.Material_Removal_Rate), 2) AS Average_MRR,
            COUNT(e.Experiment_ID) AS Experiments
        FROM cutting_tool t
        JOIN machining_experiment e
            ON t.Tool_ID = e.Tool_ID
        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID
        GROUP BY
            t.Tool_ID,
            t.Tool_Material
        ORDER BY Average_Tool_Wear ASC;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});


// =====================================================
// machine PERFORMANCE
// =====================================================

app.get("/api/machine-performance", (req, res) => {

    const sql = `
        SELECT
            m.machine_ID,
            m.machine_Name,
            COUNT(e.Experiment_ID) AS Experiments,
            ROUND(AVG(r.Material_Removal_Rate), 2) AS Average_MRR,
            ROUND(AVG(r.Tool_Wear_mm), 3) AS Average_Tool_Wear,
            ROUND(AVG(en.Energy_Consumed_kWh), 2) AS Average_Energy
        FROM machine m
        JOIN machining_experiment e
            ON m.machine_ID = e.machine_ID
        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID
        GROUP BY
            m.machine_ID,
            m.machine_Name
        ORDER BY Average_MRR DESC;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});


// =====================================================
// BEST QUALITY EXPERIMENT
// =====================================================

app.get("/api/best-quality", (req, res) => {

    const sql = `
        SELECT
            e.Experiment_ID,
            r.Tool_Wear_mm,
            r.Surface_Roughness_Ra,
            r.Material_Removal_Rate
        FROM machining_experiment e
        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID
        ORDER BY
            r.Tool_Wear_mm ASC,
            r.Surface_Roughness_Ra ASC
        LIMIT 1;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
});


// =====================================================
// BEST PRODUCTIVITY EXPERIMENT
// =====================================================

app.get("/api/best-productivity", (req, res) => {

    const sql = `
        SELECT
            e.Experiment_ID,
            r.Material_Removal_Rate,
            en.Energy_Consumed_kWh,
            c.Total_Cost
        FROM machining_experiment e
        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN machining_cost c
            ON e.Experiment_ID = c.Experiment_ID
        ORDER BY r.Material_Removal_Rate DESC
        LIMIT 1;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
});


// =====================================================
// LOWEST COST EXPERIMENT
// =====================================================

app.get("/api/lowest-cost", (req, res) => {

    const sql = `
        SELECT
            e.Experiment_ID,
            c.Total_Cost,
            r.Material_Removal_Rate,
            en.Energy_Consumed_kWh
        FROM machining_experiment e
        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN machining_cost c
            ON e.Experiment_ID = c.Experiment_ID
        ORDER BY c.Total_Cost ASC
        LIMIT 1;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
});


// =====================================================
// LOWEST ENERGY EXPERIMENT
// =====================================================

app.get("/api/lowest-energy", (req, res) => {

    const sql = `
        SELECT
            e.Experiment_ID,
            en.Energy_Consumed_kWh,
            r.Material_Removal_Rate,
            c.Total_Cost
        FROM machining_experiment e
        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN machining_cost c
            ON e.Experiment_ID = c.Experiment_ID
        ORDER BY en.Energy_Consumed_kWh ASC
        LIMIT 1;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results[0]
        });
    });
});


// =====================================================
// COMPLETE EXPERIMENT ANALYSIS
// =====================================================

app.get("/api/analysis", (req, res) => {

    const sql = `
        SELECT
            e.Experiment_ID,

            w.Material_Name,

            t.Tool_Material,

            m.machine_Name,

            o.operator_Name,

            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time,

            r.Tool_Wear_mm,
            r.Surface_Roughness_Ra,
            r.Material_Removal_Rate,

            en.Energy_Consumed_kWh,

            c.Labor_Cost,
            c.Energy_Cost,
            c.Total_Cost

        FROM machining_experiment e

        JOIN workpiece w
            ON e.workpiece_ID = w.workpiece_ID

        JOIN cutting_tool t
            ON e.Tool_ID = t.Tool_ID

        JOIN machine m
            ON e.machine_ID = m.machine_ID

        JOIN operator o
            ON e.operator_ID = o.operator_ID

        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID

        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID

        JOIN machining_cost c
            ON e.Experiment_ID = c.Experiment_ID

        ORDER BY e.Experiment_ID;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Analysis query failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });
    });
});
// =====================================================
// CRUD - CREATE EXPERIMENT
// =====================================================

app.post("/api/experiments", (req, res) => {

    const {
        Experiment_ID,
        workpiece_ID,
        Tool_ID,
        machine_ID,
        operator_ID,
        Spindle_Speed,
        Feed_Rate,
        Depth_of_Cut,
        Machining_Time
    } = req.body;

    const sql = `
        INSERT INTO machining_experiment
        (
            Experiment_ID,
            workpiece_ID,
            Tool_ID,
            machine_ID,
            operator_ID,
            Spindle_Speed,
            Feed_Rate,
            Depth_of_Cut,
            Machining_Time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        Experiment_ID,
        workpiece_ID,
        Tool_ID,
        machine_ID,
        operator_ID,
        Spindle_Speed,
        Feed_Rate,
        Depth_of_Cut,
        Machining_Time
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error("❌ Create failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Experiment created successfully",
            Experiment_ID
        });
    });
});


// =====================================================
// CRUD - UPDATE EXPERIMENT
// =====================================================

app.put("/api/experiments/:id", (req, res) => {

    const id = req.params.id;

    const {
        workpiece_ID,
        Tool_ID,
        machine_ID,
        operator_ID,
        Spindle_Speed,
        Feed_Rate,
        Depth_of_Cut,
        Machining_Time
    } = req.body;

    const sql = `
        UPDATE machining_experiment
        SET
            workpiece_ID = ?,
            Tool_ID = ?,
            machine_ID = ?,
            operator_ID = ?,
            Spindle_Speed = ?,
            Feed_Rate = ?,
            Depth_of_Cut = ?,
            Machining_Time = ?
        WHERE Experiment_ID = ?
    `;

    const values = [
        workpiece_ID,
        Tool_ID,
        machine_ID,
        operator_ID,
        Spindle_Speed,
        Feed_Rate,
        Depth_of_Cut,
        Machining_Time,
        id
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error("❌ Update failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Experiment updated successfully",
            affectedRows: result.affectedRows
        });
    });
});


// =====================================================
// CRUD - DELETE EXPERIMENT
// =====================================================

app.delete("/api/experiments/:id", (req, res) => {

    const id = req.params.id;

    db.query(
        "DELETE FROM machining_experiment WHERE Experiment_ID = ?",
        [id],
        (err, result) => {

            if (err) {
                console.error("❌ Delete failed:", err.message);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: "Experiment deleted successfully",
                affectedRows: result.affectedRows
            });
        }
    );
});


// =====================================================
// INTELLIGENT OPTIMIZATION ENGINE
// =====================================================

app.get("/api/optimization", (req, res) => {

    const sql = `
        SELECT
            e.Experiment_ID,

            w.Material_Name,

            t.Tool_Material,

            m.machine_Name,

            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time,

            r.Tool_Wear_mm,
            r.Surface_Roughness_Ra,
            r.Material_Removal_Rate,

            en.Energy_Consumed_kWh,

            c.Total_Cost

        FROM machining_experiment e

        JOIN workpiece w
            ON e.workpiece_ID = w.workpiece_ID

        JOIN cutting_tool t
            ON e.Tool_ID = t.Tool_ID

        JOIN machine m
            ON e.machine_ID = m.machine_ID

        JOIN machining_result r
            ON e.Experiment_ID = r.Experiment_ID

        JOIN energy_consumption en
            ON e.Experiment_ID = en.Experiment_ID

        JOIN machining_cost c
            ON e.Experiment_ID = c.Experiment_ID

        ORDER BY
            r.Tool_Wear_mm ASC,
            r.Surface_Roughness_Ra ASC,
            r.Material_Removal_Rate DESC,
            en.Energy_Consumed_kWh ASC,
            c.Total_Cost ASC
        LIMIT 5;
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error("❌ Optimization query failed:", err.message);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Top machining parameter combinations",
            count: results.length,
            recommendations: results
        });
    });
});

// =====================================================
// SERVER START
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`MachOpt server running on port ${PORT}`);
});