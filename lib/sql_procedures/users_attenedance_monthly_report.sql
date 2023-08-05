DELIMITER //

CREATE PROCEDURE monthlyAttendanceReport(
	selectedMonth varchar(20),
	selectedDateOfMonth varchar(20),
    companyId INT
)
BEGIN
    -- Declare variables
    DECLARE done INT DEFAULT FALSE;
   DECLARE _id INT;
    
    -- Declare cursor for the SELECT query
    DECLARE cur CURSOR FOR
        SELECT `id` AS _id FROM `employees` WHERE `status` = 1 AND `companyid` = companyId AND (`role` != 1 AND `role` != 14);
        -- Add any necessary WHERE conditions
        -- GROUP BY reference_code;

    -- Declare handler for cursor
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Open the cursor
    OPEN cur;

    -- Loop through the cursor result
    read_loop: LOOP
        -- Fetch the next row from the cursor
        FETCH cur INTO _id;

        -- Check if there are no more rows
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Process the row (example: print reference_code and total_records)
        SELECT employees.id, employees.name, (select CASE WHEN EXISTS (SELECT 1 FROM attendance WHERE attendance.employee_id = _id AND DATE_FORMAT(attendance.date, "%Y-%m-%d") = month_date) THEN (SELECT IFNULL(DATE_FORMAT(attendance.`intime`, "%H:%i"), "--:--") FROM attendance WHERE DATE_FORMAT(attendance.date, "%Y-%m-%d") = month_date AND attendance.employee_id = _id) ELSE 'A' END) AS attendance_intimes, (select CASE WHEN EXISTS (SELECT 1 FROM attendance WHERE attendance.employee_id = _id AND DATE_FORMAT(attendance.date, "%Y-%m-%d") = month_date) THEN (SELECT IFNULL(DATE_FORMAT(attendance.`outtime`, "%H:%i"), "--:--") FROM attendance WHERE DATE_FORMAT(attendance.date, "%Y-%m-%d") = month_date AND attendance.employee_id = _id) ELSE 'A' END) AS attendance_outtimes, (DATE_FORMAT(month_date,"%D")) AS _date FROM ( SELECT ADDDATE(selectedDateOfMonth, INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY) AS month_date FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a CROSS JOIN ( SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 ) AS b CROSS JOIN ( SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 ) AS c ) AS dates INNER JOIN employees WHERE employees.id = _id AND DATE_FORMAT(month_date, "%M-%Y") = selectedMonth ORDER BY month_date;
        
        
        -- Add any additional processing logic here
        
    END LOOP;

    -- Close the cursor
    CLOSE cur;

END //

DELIMITER ;
