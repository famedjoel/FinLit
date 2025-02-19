import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PropTypes from "prop-types";

const EASY_BUDGET = 1500;
const HARD_BUDGET = 800;

const items = [
  { id: 1, name: "Rent", category: "Essentials", cost: 500 },
  { id: 2, name: "Netflix Subscription", category: "Luxuries", cost: 15 },
  { id: 3, name: "Groceries", category: "Essentials", cost: 200 },
  { id: 4, name: "Concert Tickets", category: "Luxuries", cost: 100 },
  { id: 5, name: "Electricity Bill", category: "Essentials", cost: 80 },
  { id: 6, name: "Vacation Trip", category: "Luxuries", cost: 300 },
  { id: 7, name: "Emergency Savings", category: "Savings", cost: 200 },
  { id: 8, name: "Gym Membership", category: "Luxuries", cost: 50 },
];

function DraggableItem({ item, isUsed }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ITEM",
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isUsed,
  }));

  return (
    <div 
      ref={drag} 
      className={`draggable-item ${isDragging ? "dragging" : ""} ${isUsed ? "used" : ""}`}
      style={{
        opacity: isUsed ? 0.5 : 1,
        cursor: isUsed ? "not-allowed" : "grab"
      }}
    >
      {item.name} (${item.cost})
    </div>
  );
}

function DropZone({ category, onDrop, allocatedItems, totalCost }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "ITEM",
    drop: (item) => onDrop(item, category),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className={`drop-zone ${isOver ? "over" : ""}`} ref={drop}>
      <h3>{category}</h3>
      <p>Total: ${totalCost}</p>
      {allocatedItems.map((item) => (
        <div key={item.id} className="dropped-item">
          {item.name} (${item.cost})
        </div>
      ))}
    </div>
  );
}

function MoneyMatch() {
  const [budgetLimit, setBudgetLimit] = useState(EASY_BUDGET);
  const [essentials, setEssentials] = useState([]);
  const [luxuries, setLuxuries] = useState([]);
  const [savings, setSavings] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [usedItems, setUsedItems] = useState(new Set());
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
  };

  const handleDrop = (item, category) => {
    // Check if item is already used
    if (usedItems.has(item.id)) {
      showAlert("This item has already been allocated!", "error");
      return;
    }

    // Add item to used items
    setUsedItems(new Set([...usedItems, item.id]));

    if (category === "Essentials") setEssentials((prev) => [...prev, item]);
    if (category === "Luxuries") setLuxuries((prev) => [...prev, item]);
    if (category === "Savings") setSavings((prev) => [...prev, item]);

    setTotalSpent((prev) => prev + item.cost);
    showAlert(`Added ${item.name} to ${category}.`, "success");
  };

  const resetGame = () => {
    setEssentials([]);
    setLuxuries([]);
    setSavings([]);
    setTotalSpent(0);
    setUsedItems(new Set());
    setAlert({ show: false, message: "", type: "" });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="game-container">
        <h2>💰 Money Budgeting Challenge</h2>
        <p>Manage your budget wisely. Don&apos;t overspend!</p>

        {alert.show && (
          <div 
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: alert.type === 'error' ? '#fee2e2' : '#dcfce7',
              color: alert.type === 'error' ? '#dc2626' : '#16a34a',
              border: `1px solid ${alert.type === 'error' ? '#dc2626' : '#16a34a'}`,
              zIndex: 1000,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              minWidth: '300px',
              textAlign: 'center'
            }}
          >
            {alert.message}
          </div>
        )}

        <div className="budget-selector">
          <label>
            Select Difficulty:  
            <select
              onChange={(e) => {
                setBudgetLimit(e.target.value === "Easy" ? EASY_BUDGET : HARD_BUDGET);
                resetGame();
              }}
            >
              <option value="Easy">Easy ($1500)</option>
              <option value="Hard">Hard ($800)</option>
            </select>
          </label>
        </div>

        <h3 className="budget">Budget: ${budgetLimit} | Spent: ${totalSpent}</h3>

        <div className="game-board">
          <div className="items-container">
            {items.map((item) => (
              <DraggableItem 
                key={item.id} 
                item={item} 
                isUsed={usedItems.has(item.id)}
              />
            ))}
          </div>
          <div className="drop-zones">
            <DropZone 
              category="Essentials" 
              onDrop={handleDrop} 
              allocatedItems={essentials} 
              totalCost={essentials.reduce((sum, item) => sum + item.cost, 0)} 
            />
            <DropZone 
              category="Luxuries" 
              onDrop={handleDrop} 
              allocatedItems={luxuries} 
              totalCost={luxuries.reduce((sum, item) => sum + item.cost, 0)} 
            />
            <DropZone 
              category="Savings" 
              onDrop={handleDrop} 
              allocatedItems={savings} 
              totalCost={savings.reduce((sum, item) => sum + item.cost, 0)} 
            />
          </div>
        </div>

        <button className="reset-btn" onClick={resetGame}>🔄 Reset Game</button>
      </div>
    </DndProvider>
  );
}

// PropTypes definitions
DraggableItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    cost: PropTypes.number.isRequired,
  }).isRequired,
  isUsed: PropTypes.bool.isRequired
};

DropZone.propTypes = {
  category: PropTypes.string.isRequired,
  onDrop: PropTypes.func.isRequired,
  allocatedItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      cost: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalCost: PropTypes.number.isRequired,
};

export default MoneyMatch;