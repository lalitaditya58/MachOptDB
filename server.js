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
            e.Workpiece_ID,
            e.Tool_ID,
            e.Machine_ID,
            e.Operator_ID,
            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time,
            r.Tool_Wear_mm,
            r.Surface_Roughness_Ra,
            r.Material_Removal_Rate,
            en.Energy_Consumed_kWh,
            c.Total_Cost
        FROM Machining_Experiment e
        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN Machining_Cost c
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

        FROM Machining_Experiment e

        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID

        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID

        JOIN Machining_Cost c
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
            e.Workpiece_ID,
            e.Tool_ID,
            e.Machine_ID,
            e.Operator_ID,
            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time
        FROM Machining_Result r
        JOIN Machining_Experiment e
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
            e.Workpiece_ID,
            e.Tool_ID,
            e.Machine_ID,
            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time
        FROM Energy_Consumption en
        JOIN Machining_Experiment e
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
            e.Workpiece_ID,
            e.Tool_ID,
            e.Machine_ID,
            e.Operator_ID,
            e.Machining_Time
        FROM Machining_Cost c
        JOIN Machining_Experiment e
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
// WORKPIECES
// =====================================================

app.get("/api/workpieces", (req, res) => {

    db.query(
        "SELECT * FROM Workpiece ORDER BY Workpiece_ID",
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
        "SELECT * FROM Cutting_Tool ORDER BY Tool_ID",
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
// MACHINES
// =====================================================

app.get("/api/machines", (req, res) => {

    db.query(
        "SELECT * FROM Machine ORDER BY Machine_ID",
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
// OPERATORS
// =====================================================

app.get("/api/operators", (req, res) => {

    db.query(
        "SELECT * FROM Operator ORDER BY Operator_ID",
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
        FROM Cutting_Tool t
        JOIN Machining_Experiment e
            ON t.Tool_ID = e.Tool_ID
        JOIN Machining_Result r
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
// MACHINE PERFORMANCE
// =====================================================

app.get("/api/machine-performance", (req, res) => {

    const sql = `
        SELECT
            m.Machine_ID,
            m.Machine_Name,
            COUNT(e.Experiment_ID) AS Experiments,
            ROUND(AVG(r.Material_Removal_Rate), 2) AS Average_MRR,
            ROUND(AVG(r.Tool_Wear_mm), 3) AS Average_Tool_Wear,
            ROUND(AVG(en.Energy_Consumed_kWh), 2) AS Average_Energy
        FROM Machine m
        JOIN Machining_Experiment e
            ON m.Machine_ID = e.Machine_ID
        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID
        GROUP BY
            m.Machine_ID,
            m.Machine_Name
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
        FROM Machining_Experiment e
        JOIN Machining_Result r
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
        FROM Machining_Experiment e
        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN Machining_Cost c
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
        FROM Machining_Experiment e
        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN Machining_Cost c
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
        FROM Machining_Experiment e
        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID
        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID
        JOIN Machining_Cost c
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

            m.Machine_Name,

            o.Operator_Name,

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

        FROM Machining_Experiment e

        JOIN Workpiece w
            ON e.Workpiece_ID = w.Workpiece_ID

        JOIN Cutting_Tool t
            ON e.Tool_ID = t.Tool_ID

        JOIN Machine m
            ON e.Machine_ID = m.Machine_ID

        JOIN Operator o
            ON e.Operator_ID = o.Operator_ID

        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID

        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID

        JOIN Machining_Cost c
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
        Workpiece_ID,
        Tool_ID,
        Machine_ID,
        Operator_ID,
        Spindle_Speed,
        Feed_Rate,
        Depth_of_Cut,
        Machining_Time
    } = req.body;

    const sql = `
        INSERT INTO Machining_Experiment
        (
            Experiment_ID,
            Workpiece_ID,
            Tool_ID,
            Machine_ID,
            Operator_ID,
            Spindle_Speed,
            Feed_Rate,
            Depth_of_Cut,
            Machining_Time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        Experiment_ID,
        Workpiece_ID,
        Tool_ID,
        Machine_ID,
        Operator_ID,
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
        Workpiece_ID,
        Tool_ID,
        Machine_ID,
        Operator_ID,
        Spindle_Speed,
        Feed_Rate,
        Depth_of_Cut,
        Machining_Time
    } = req.body;

    const sql = `
        UPDATE Machining_Experiment
        SET
            Workpiece_ID = ?,
            Tool_ID = ?,
            Machine_ID = ?,
            Operator_ID = ?,
            Spindle_Speed = ?,
            Feed_Rate = ?,
            Depth_of_Cut = ?,
            Machining_Time = ?
        WHERE Experiment_ID = ?
    `;

    const values = [
        Workpiece_ID,
        Tool_ID,
        Machine_ID,
        Operator_ID,
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
        "DELETE FROM Machining_Experiment WHERE Experiment_ID = ?",
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

            m.Machine_Name,

            e.Spindle_Speed,
            e.Feed_Rate,
            e.Depth_of_Cut,
            e.Machining_Time,

            r.Tool_Wear_mm,
            r.Surface_Roughness_Ra,
            r.Material_Removal_Rate,

            en.Energy_Consumed_kWh,

            c.Total_Cost

        FROM Machining_Experiment e

        JOIN Workpiece w
            ON e.Workpiece_ID = w.Workpiece_ID

        JOIN Cutting_Tool t
            ON e.Tool_ID = t.Tool_ID

        JOIN Machine m
            ON e.Machine_ID = m.Machine_ID

        JOIN Machining_Result r
            ON e.Experiment_ID = r.Experiment_ID

        JOIN Energy_Consumption en
            ON e.Experiment_ID = en.Experiment_ID

        JOIN Machining_Cost c
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