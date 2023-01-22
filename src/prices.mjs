import "./polyfills.mjs";
import express from "express";

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.

function createApp(database) {
  const app = express();

  app.put("/prices", (req, res) => {
    const liftPassCost = req.query.cost;
    const liftPassType = req.query.type;
    database.setBasePrice(liftPassType, liftPassCost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const date = parseDate(req.query.date);
    const tdate = parseTemporalDate(req.query.date);
    const cost = calculateCost(age, type, date, tdate, baseCost);
    res.json({ cost });
  });

  function parseDate(dateString) {
    if (dateString) {
      return new Date(dateString);
    }
  }

  function parseTemporalDate(dateString) {if(dateString) return Temporal.PlainDate.from(dateString)}

  function calculateCost(age, type, date, tdate, baseCost) {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, date, tdate, baseCost);
    }
  }

  function calculateCostForNightTicket(age, baseCost) {
    if (age === undefined) {
      return 0;
    }
    if (age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  }

  function calculateCostForDayTicket(age, date, tdate, baseCost) {
    let reduction = calculateReduction(date,tdate);
    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  }

  function calculateReduction(date, tdate) {
    let reduction = 0;
    if (date && isMonday(tdate) && !isHoliday(null, tdate)) {
      reduction = 35;
    }
    return reduction;
  }

  function isMonday(tdate) {
    return tdate.dayOfWeek === 1;
  }

  function isHoliday(date, tdate) {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let th = Temporal.PlainDate.from(row.holiday);
      if (
        tdate &&
        tdate.year === tdate.year &&
        tdate.month === th.month &&
        tdate.day === th.day
      ) {
        return true;
      }
    }
    return false;
  }

  return app;
}

export { createApp };
