// src/pages/Rewards.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Rewards.css';

// Set API base URL dynamically
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:7900`;

function Rewards() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState({ show: false, success: false, message: '' });
  const [confirmPurchase, setConfirmPurchase] = useState(null);
  const [equippedRewards, setEquippedRewards] = useState({});

  // Reward categories with icons
  const categories = [
    { id: 'all', name: 'All Rewards', icon: '🎁' },
    { id: 'avatar_frame', name: 'Avatar Frames', icon: '🖼️' },
    { id: 'badge', name: 'Profile Badges', icon: '📛' },
    { id: 'theme', name: 'Profile Themes', icon: '🎨' },
    { id: 'booster', name: 'Game Boosters', icon: '⚡' },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchRewards();
      fetchUserPoints();
      fetchEquippedRewards();
    }
  }, [user]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/rewards/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch rewards');
      const data = await response.json();
      setRewards(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/points/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch user points');
      const data = await response.json();
      setUserPoints(data.total_points || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const fetchEquippedRewards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rewards/equipped/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch equipped rewards');
      const data = await response.json();

      // Convert to object by type for easy lookup
      const equipped = {};
      data.forEach(reward => {
        equipped[reward.type] = reward.id;
      });

      setEquippedRewards(equipped);
    } catch (error) {
      console.error('Error fetching equipped rewards:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleShowRewardDetails = (reward) => {
    setSelectedReward(reward);
  };

  const handleCloseDetails = () => {
    setSelectedReward(null);
  };

  const handlePurchaseClick = (reward) => {
    // Show confirmation dialog
    setConfirmPurchase(reward);
  };

  const handleConfirmPurchase = async () => {
    try {
      if (!confirmPurchase) return;

      const response = await fetch(`${API_BASE_URL}/rewards/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          rewardId: confirmPurchase.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPurchaseStatus({
          show: true,
          success: true,
          message: result.message || 'Reward purchased successfully!',
        });

        // Update user points and rewards
        fetchUserPoints();
        fetchRewards();
      } else {
        setPurchaseStatus({
          show: true,
          success: false,
          message: result.message || 'Failed to purchase reward.',
        });
      }

      // Close confirmation dialog
      setConfirmPurchase(null);

      // Auto-hide the purchase status after 3 seconds
      setTimeout(() => {
        setPurchaseStatus({ show: false, success: false, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error purchasing reward:', error);
      setPurchaseStatus({
        show: true,
        success: false,
        message: 'An error occurred during purchase.',
      });
      setConfirmPurchase(null);
    }
  };

  const handleCancelPurchase = () => {
    setConfirmPurchase(null);
  };

  const handleToggleEquip = async (reward) => {
    try {
      // Determine if we're equipping or unequipping
      const isCurrentlyEquipped = equippedRewards[reward.type] === reward.id;
      const shouldEquip = !isCurrentlyEquipped;

      const response = await fetch(`${API_BASE_URL}/rewards/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          rewardId: reward.id,
          equipped: shouldEquip,
        }),
      });

      if (response.ok) {
        // Update the equipped rewards
        const newEquipped = { ...equippedRewards };

        if (shouldEquip) {
          newEquipped[reward.type] = reward.id;
        } else {
          delete newEquipped[reward.type];
        }

        setEquippedRewards(newEquipped);

        // Show feedback message
        setPurchaseStatus({
          show: true,
          success: true,
          message: shouldEquip ? `${reward.name} equipped!` : `${reward.name} unequipped!`,
        });

        // Auto-hide the status after 2 seconds
        setTimeout(() => {
          setPurchaseStatus({ show: false, success: false, message: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error toggling reward equipped status:', error);
    }
  };

  // Filter rewards based on active category, search query, and owned status
  const filteredRewards = rewards.filter(reward => {
    // Filter by category
    const categoryMatch = activeCategory === 'all' || reward.type === activeCategory;

    // Filter by search query
    const searchMatch = searchQuery === '' ||
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by owned status
    const ownedMatch = !showOwnedOnly || reward.acquired;

    return categoryMatch && searchMatch && ownedMatch;
  });

  // Group rewards by type for better organization
  const groupedRewards = filteredRewards.reduce((acc, reward) => {
    if (!acc[reward.type]) {
      acc[reward.type] = [];
    }
    acc[reward.type].push(reward);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="rewards-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-container">
      <h2>🎁 Rewards Shop</h2>

      <div className="points-banner">
        <div className="user-points">
          <span className="points-icon">💰</span>
          <span className="points-label">Your Points:</span>
          <span className="points-value">{userPoints}</span>
        </div>
      </div>

      <div className="rewards-filters">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        <div className="filter-options">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-toggle">
            <label className="toggle">
              <input
                type="checkbox"
                checked={showOwnedOnly}
                onChange={() => setShowOwnedOnly(!showOwnedOnly)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Show Owned Only</span>
            </label>
          </div>
        </div>
      </div>

      <div className="rewards-list">
        {Object.entries(groupedRewards).map(([type, typeRewards]) => {
          const categoryInfo = categories.find(c => c.id === type) || { name: 'Uncategorized', icon: '🎁' };

          return (
            <div key={type} className="reward-category-section">
              <h3 className="category-header">
                <span className="category-header-icon">{categoryInfo.icon}</span>
                <span>{categoryInfo.name}</span>
              </h3>

              <div className="reward-cards">
                {typeRewards.map(reward => {
                  const isEquipped = equippedRewards[reward.type] === reward.id;

                  return (
                    <div
                      key={reward.id}
                      className={`reward-card ${reward.acquired ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`}
                      onClick={() => handleShowRewardDetails(reward)}
                    >
                      <div className="reward-icon">{reward.icon}</div>
                      <div className="reward-info">
                        <h4 className="reward-name">
                          {reward.name}
                          {isEquipped && <span className="equipped-badge">Equipped</span>}
                        </h4>
                        <p className="reward-description">{reward.description}</p>
                      </div>
                      <div className="reward-price">
                        {!reward.acquired
                          ? (
                          <>
                            <span className="price-icon">💰</span>
                            <span className="price-amount">{reward.pointsCost}</span>
                          </>
                            )
                          : (
                          <span className="owned-label">Owned</span>
                            )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredRewards.length === 0 && (
          <div className="no-rewards">
            <p>No rewards found matching your criteria.</p>
            <button onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
              setShowOwnedOnly(false);
            }}>Reset Filters</button>
          </div>
        )}
      </div>

      {/* Reward Details Modal */}
      {selectedReward && (
        <div className="reward-modal-overlay">
          <div className="reward-modal">
            <button className="modal-close" onClick={handleCloseDetails}>×</button>

            <div className={`reward-detail-card ${selectedReward.acquired ? 'owned' : ''}`}>
              <div className="reward-detail-header">
                <div className="detail-icon">{selectedReward.icon}</div>
                <div className="detail-title">
                  <h3>{selectedReward.name}</h3>
                  <span className="detail-category">
                    {categories.find(c => c.id === selectedReward.type)?.name}
                  </span>
                </div>
              </div>

              <div className="reward-detail-body">
                <p className="detail-description">{selectedReward.description}</p>

                {selectedReward.imageUrl && (
                  <div className="reward-image">
                    <img src={selectedReward.imageUrl} alt={selectedReward.name} />
                  </div>
                )}

                <div className="detail-stats">
                  {!selectedReward.acquired && (
                    <div className="detail-stat">
                      <span className="stat-label">Cost:</span>
                      <span className="stat-value">{selectedReward.pointsCost} points</span>
                    </div>
                  )}

                  {selectedReward.acquired && (
                    <div className="detail-stat">
                      <span className="stat-label">Acquired:</span>
                      <span className="stat-value">
                        {selectedReward.acquiredAt
                          ? new Date(selectedReward.acquiredAt).toLocaleDateString()
                          : 'Yes'}
                      </span>
                    </div>
                  )}

                  <div className="detail-stat">
                    <span className="stat-label">Type:</span>
                    <span className="stat-value">
                      {categories.find(c => c.id === selectedReward.type)?.name}
                    </span>
                  </div>
                </div>

                <div className="detail-tip">
                  <h4>How to use:</h4>
                  <p>
                    {selectedReward.type === 'avatar_frame' && 'This frame will appear around your profile picture when equipped.'}
                    {selectedReward.type === 'badge' && 'This badge will appear on your profile when equipped.'}
                    {selectedReward.type === 'theme' && 'This theme will change the appearance of your profile when equipped.'}
                    {selectedReward.type === 'booster' && 'This booster provides temporary benefits in games when activated.'}
                  </p>
                </div>
              </div>

              <div className="reward-detail-footer">
                {selectedReward.acquired
                  ? (
                  <button
                    className={`${equippedRewards[selectedReward.type] === selectedReward.id
                      ? 'unequip-button'
                      : 'equip-button'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleEquip(selectedReward);
                    }}
                  >
                    {equippedRewards[selectedReward.type] === selectedReward.id
                      ? 'Unequip'
                      : 'Equip'}
                  </button>
                    )
                  : (
                  <button
                    className="purchase-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchaseClick(selectedReward);
                    }}
                    disabled={userPoints < selectedReward.pointsCost}
                  >
                    {userPoints >= selectedReward.pointsCost
                      ? `Purchase (${selectedReward.pointsCost} points)`
                      : `Not enough points (${userPoints}/${selectedReward.pointsCost})`}
                  </button>
                    )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Dialog */}
      {confirmPurchase && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Purchase</h3>
            <p>Are you sure you want to purchase <strong>{confirmPurchase.name}</strong> for <strong>{confirmPurchase.pointsCost} points</strong>?</p>

            <div className="points-after-purchase">
              <p>Your current balance: <strong>{userPoints} points</strong></p>
              <p>Balance after purchase: <strong>{userPoints - confirmPurchase.pointsCost} points</strong></p>
            </div>

            <div className="confirmation-buttons">
              <button
                className="cancel-button"
                onClick={handleCancelPurchase}
              >
                Cancel
              </button>
              <button
                className="confirm-button"
                onClick={handleConfirmPurchase}
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Status Toast */}
      {purchaseStatus.show && (
        <div className={`status-toast ${purchaseStatus.success ? 'success' : 'error'}`}>
          {purchaseStatus.message}
        </div>
      )}
    </div>
  );
}

export default Rewards;
