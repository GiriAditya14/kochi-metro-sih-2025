# ML Models Phase Documentation
## NeuralInduction AI - KMRL Train Induction Optimization System

---

## 1. Overview & Objectives

### 1.1 Purpose
The ML Models Phase implements a continuous learning system that improves decision accuracy over time by analyzing historical decision outcomes, predicting maintenance risks, optimizing mileage balancing, forecasting branding compliance, and enhancing overall system intelligence through feedback loops.

### 1.2 Core Responsibilities
- **Historical Learning**: Analyze past decisions and their outcomes to improve future predictions
- **Predictive Maintenance**: Forecast component failure probability and maintenance needs
- **Mileage Optimization**: Predict optimal mileage distribution patterns
- **Branding Compliance Forecasting**: Predict advertiser SLA breach risks
- **Punctuality Prediction**: Forecast service reliability impact of decisions
- **Stabling Efficiency Modeling**: Optimize depot positioning for energy efficiency
- **Feedback Loop Integration**: Continuously learn from decision outcomes
- **Model Retraining Pipeline**: Automated model updates based on new data

### 1.3 Success Metrics
- **Prediction Accuracy**: 90%+ accuracy for maintenance risk predictions
- **Learning Improvement**: 5%+ accuracy improvement per quarter through feedback loops
- **Punctuality Forecasting**: 95%+ accuracy in predicting punctuality impact
- **Model Performance**: <500ms inference time for real-time predictions
- **Training Efficiency**: Automated retraining completes within 4 hours

### 1.4 Key Differentiators
- **Continuous Learning**: Self-improving system that adapts to operational patterns
- **Multi-Model Ensemble**: Combination of specialized models for different objectives
- **Real-time Inference**: Fast predictions for agent decision support
- **Explainable Predictions**: Transparent model outputs for supervisor trust

---

## 2. Architecture & Design

### 2.1 Technology Stack
- **ML Framework**: PyTorch + TensorFlow (hybrid approach)
- **Training Infrastructure**: GPU-enabled compute for model training
- **Model Serving**: FastAPI endpoints for real-time inference
- **Data Processing**: Pandas, NumPy for feature engineering
- **Time Series**: Prophet, LSTM networks for temporal patterns
- **Ensemble Methods**: XGBoost, Random Forest for classification
- **Model Registry**: MLflow for model versioning and tracking
- **Data Storage**: PostgreSQL for historical data, feature store

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Ingestion Layer                     │
│  (Historical Decisions, Outcomes, Feedback from Backend)    │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Feature Engineering Pipeline                │
│  (Data Cleaning, Feature Extraction, Normalization)         │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│   Model 1   │  │   Model 2    │  │   Model 3    │
│ Maintenance │  │   Mileage    │  │  Branding    │
│ Risk        │  │  Balancing   │  │  Compliance  │
└───────┬──────┘  └───────┬──────┘  └───────┬──────┘
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│   Model 4   │  │   Model 5    │  │   Model 6    │
│ Punctuality │  │   Stabling    │  │  Ensemble    │
│ Predictor   │  │  Efficiency  │  │  Combiner    │
└───────┬──────┘  └───────┬──────┘  └───────┬──────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Model Serving Layer (FastAPI)                   │
│         (Real-time Inference for Agent Phase)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Feedback Loop & Learning System                  │
│    (Outcome Tracking, Model Retraining, Improvement)        │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow

**Training Flow**:
1. Historical data ingestion from Backend PostgreSQL
2. Feature engineering and preprocessing
3. Model training on labeled data
4. Model evaluation and validation
5. Model registration in MLflow
6. Deployment to serving layer

**Inference Flow**:
1. Agent Phase requests prediction
2. Feature extraction from current train state
3. Model inference (real-time)
4. Prediction results returned to Agent Phase
5. Results used in agent decision-making

**Feedback Flow**:
1. Decision outcomes recorded in Backend
2. Feedback data extracted and labeled
3. Model performance evaluation
4. Retraining triggered if accuracy drops
5. New model version deployed
6. Continuous improvement cycle

---

## 3. Core ML Models

### 3.1 Model 1: Maintenance Risk Classifier

#### 3.1.1 Purpose
Predict the probability of component failure or maintenance requirement for each train, enabling proactive scheduling and preventing unscheduled withdrawals.

#### 3.1.2 Model Type
- **Primary**: Gradient Boosting Classifier (XGBoost)
- **Secondary**: Random Forest for ensemble
- **Deep Learning**: LSTM for temporal pattern recognition

#### 3.1.3 Input Features
- **Mileage Features**:
  - Cumulative mileage (overall, bogie, brake pads, HVAC)
  - Daily mileage patterns
  - Mileage deviation from fleet average
  - Mileage growth rate
- **Maintenance History**:
  - Last maintenance date
  - Maintenance frequency
  - Component replacement history
  - Job card patterns
- **Operational Features**:
  - Service days since last maintenance
  - Average daily service hours
  - Route patterns
  - Load factors
- **Temporal Features**:
  - Days since last inspection
  - Seasonal patterns
  - Time since last component replacement

#### 3.1.4 Output
- **Probability Scores** (0-1):
  - Overall maintenance risk
  - Bogie failure risk
  - Brake pad replacement risk
  - HVAC failure risk
  - Emergency maintenance probability
- **Risk Categories**:
  - Low risk (0-0.3)
  - Medium risk (0.3-0.6)
  - High risk (0.6-0.8)
  - Critical risk (0.8-1.0)
- **Recommended Actions**:
  - Continue service
  - Schedule preventive maintenance
  - Immediate inspection required
  - Emergency maintenance needed

#### 3.1.5 Training Data
- Historical maintenance records
- Component failure incidents
- Mileage data at time of failures
- Job card patterns
- Decision outcomes (did train require maintenance?)

#### 3.1.6 Performance Metrics
- **Accuracy**: >90% for critical risk detection
- **Precision**: >85% (minimize false positives)
- **Recall**: >90% (catch all critical risks)
- **F1-Score**: >88%
- **ROC-AUC**: >0.92

---

### 3.2 Model 2: Mileage Balancing Optimizer

#### 3.2.1 Purpose
Predict optimal mileage distribution patterns to equalize wear across the fleet, extending component life and reducing maintenance costs.

#### 3.2.2 Model Type
- **Primary**: Reinforcement Learning (DQN - Deep Q-Network)
- **Supporting**: Linear Regression for trend analysis
- **Optimization**: Genetic Algorithm for distribution patterns

#### 3.2.3 Input Features
- **Fleet State**:
  - Current mileage of all trains
  - Fleet average mileage
  - Mileage distribution variance
  - Target mileage range
- **Historical Patterns**:
  - Past mileage balancing success
  - Component wear correlation with mileage
  - Maintenance cost vs. mileage curves
- **Operational Constraints**:
  - Available trains for service
  - Service schedule requirements
  - Maintenance bay availability

#### 3.2.4 Output
- **Optimal Mileage Targets**:
  - Recommended mileage for each train
  - Target service days per train
  - Mileage allocation strategy
- **Balancing Scores**:
  - Current balance score (0-100)
  - Projected balance after allocation
  - Deviation from optimal distribution
- **Recommendations**:
  - Which trains should enter service
  - Which trains should be on standby
  - Maintenance scheduling for overused trains

#### 3.2.5 Training Data
- Historical mileage distributions
- Component wear patterns
- Maintenance cost data
- Successful balancing outcomes
- Fleet utilization patterns

#### 3.2.6 Performance Metrics
- **Distribution Variance**: <5% deviation from optimal
- **Component Life Extension**: 15%+ increase in average component life
- **Cost Reduction**: 20%+ reduction in premature maintenance

---

### 3.3 Model 3: Branding Compliance Forecaster

#### 3.3.1 Purpose
Predict advertiser SLA breach risks and optimize branding exposure hours to prevent revenue penalties.

#### 3.3.2 Model Type
- **Primary**: Time Series Forecasting (Prophet + LSTM)
- **Supporting**: Classification model for breach risk
- **Optimization**: Linear Programming for exposure allocation

#### 3.3.3 Input Features
- **Contract Data**:
  - Required exposure hours
  - Current exposure hours
  - Days remaining in contract
  - Contract expiry date
  - Penalty amounts
- **Historical Patterns**:
  - Past exposure rates
  - Seasonal variations
  - Service availability patterns
  - Breach incidents
- **Operational Context**:
  - Available trains for service
  - Service schedule
  - Maintenance windows

#### 3.3.4 Output
- **Breach Risk Predictions**:
  - Probability of SLA breach (0-1)
  - Days until breach if current trend continues
  - Exposure deficit projection
- **Priority Scores**:
  - Urgency score (0-100)
  - Revenue impact estimate
  - Recommended service allocation
- **Optimization Recommendations**:
  - Minimum service days required
  - Train allocation strategy
  - Exposure hour targets

#### 3.3.5 Training Data
- Historical branding contracts
- Exposure hour records
- SLA breach incidents
- Revenue penalty data
- Service allocation patterns

#### 3.3.6 Performance Metrics
- **Breach Prediction Accuracy**: >95%
- **False Positive Rate**: <5%
- **Revenue Protection**: 100% prevention of avoidable breaches
- **Forecast Error**: <10% for exposure hour predictions

---

### 3.4 Model 4: Punctuality Impact Predictor

#### 3.4.1 Purpose
Forecast the impact of induction decisions on the 99.5% punctuality KPI, enabling proactive risk mitigation.

#### 3.4.2 Model Type
- **Primary**: Regression Model (XGBoost Regressor)
- **Time Series**: ARIMA for trend analysis
- **Ensemble**: Stacking multiple models

#### 3.4.3 Input Features
- **Decision Features**:
  - Number of trains in revenue service
  - Train reliability scores
  - Maintenance risk levels
  - Standby train availability
- **Historical Patterns**:
  - Past punctuality performance
  - Decision impact history
  - Failure rate patterns
  - Service disruption incidents
- **Operational Context**:
  - Expected passenger load
  - Route complexity
  - Weather conditions (if available)
  - Special events

#### 3.4.4 Output
- **Punctuality Predictions**:
  - Expected punctuality percentage
  - Confidence interval
  - Risk of dropping below 99.5%
- **Impact Analysis**:
  - Contribution of each train to punctuality
  - Risk factors identified
  - Mitigation recommendations
- **Scenario Comparisons**:
  - Punctuality impact of different decisions
  - Trade-off analysis

#### 3.4.5 Training Data
- Historical punctuality records
- Decision outcomes and punctuality impact
- Train reliability data
  - Service disruption logs
  - Passenger load data

#### 3.4.6 Performance Metrics
- **Prediction Accuracy**: >95% for punctuality forecasts
- **Error Margin**: <0.2% for 99.5% target predictions
- **Risk Detection**: 100% identification of decisions risking KPI breach

---

### 3.5 Model 5: Stabling Efficiency Optimizer

#### 3.5.1 Purpose
Optimize train positioning in depot to minimize shunting movements, reduce energy consumption, and improve morning turn-out efficiency.

#### 3.5.2 Model Type
- **Primary**: Graph Neural Network (GNN) for depot layout
- **Optimization**: Genetic Algorithm for positioning
- **Regression**: Energy consumption predictor

#### 3.5.3 Input Features
- **Depot Geometry**:
  - Bay positions and capacities
  - Shunting path distances
  - Entry/exit point locations
  - Current train positions
- **Train Characteristics**:
  - Train size and type
  - Service entry requirements
  - Maintenance status
  - Next service time
- **Operational Constraints**:
  - Bay availability
  - Shunting time windows
  - Energy consumption rates
  - Safety requirements

#### 3.5.4 Output
- **Optimal Positioning**:
  - Recommended bay for each train
  - Shunting sequence
  - Energy consumption estimate
  - Turn-out time projection
- **Efficiency Scores**:
  - Current efficiency (0-100)
  - Projected efficiency after repositioning
  - Energy savings estimate
- **Recommendations**:
  - Repositioning priorities
  - Shunting schedule
  - Bay allocation strategy

#### 3.5.5 Training Data
- Historical stabling positions
- Shunting movement logs
- Energy consumption records
- Turn-out time data
- Efficiency outcomes

#### 3.5.6 Performance Metrics
- **Energy Reduction**: 50%+ reduction in unnecessary shunting
- **Time Savings**: 30%+ reduction in morning turn-out time
- **Efficiency Improvement**: 40%+ improvement in depot utilization

---

### 3.6 Model 6: Ensemble Combiner

#### 3.6.1 Purpose
Combine predictions from all specialized models into unified recommendations for the Agent Phase, ensuring consistency and optimal decision support.

#### 3.6.2 Model Type
- **Primary**: Stacking Ensemble
- **Meta-Learner**: Neural Network
- **Weight Optimization**: Bayesian Optimization

#### 3.6.3 Input Features
- Predictions from all 5 specialized models
- Model confidence scores
- Historical ensemble performance
- Context features (decision date, fleet state)

#### 3.6.4 Output
- **Unified Predictions**:
  - Combined risk scores
  - Integrated recommendations
  - Confidence intervals
- **Model Weights**:
  - Dynamic weighting based on context
  - Model reliability scores
- **Final Recommendations**:
  - Service readiness scores
  - Maintenance priorities
  - Optimization suggestions

#### 3.6.5 Performance Metrics
- **Combined Accuracy**: >92% for overall predictions
- **Consistency**: <5% variance in repeated predictions
- **Calibration**: Well-calibrated probability estimates

---

## 4. Feature Engineering Pipeline

### 4.1 Data Preprocessing
- **Missing Value Handling**: Imputation strategies for incomplete data
- **Outlier Detection**: Identify and handle anomalous values
- **Data Normalization**: Standardize features for model training
- **Temporal Alignment**: Synchronize time-series data

### 4.2 Feature Extraction
- **Temporal Features**: Time since events, seasonal patterns, trends
- **Aggregate Features**: Fleet averages, deviations, percentiles
- **Interaction Features**: Cross-feature combinations
- **Domain Features**: Railway-specific metrics (mileage, wear, exposure)

### 4.3 Feature Selection
- **Correlation Analysis**: Remove highly correlated features
- **Importance Ranking**: Select top features by model importance
- **Dimensionality Reduction**: PCA for high-dimensional data
- **Domain Knowledge**: Include domain-expert validated features

### 4.4 Feature Store
- **Real-time Features**: Computed on-the-fly for inference
- **Batch Features**: Pre-computed for training
- **Feature Versioning**: Track feature definitions over time
- **Feature Monitoring**: Detect feature drift and degradation

---

## 5. Training Pipeline

### 5.1 Data Preparation
- **Data Extraction**: Query historical data from Backend PostgreSQL
- **Data Validation**: Ensure data quality and completeness
- **Label Creation**: Generate labels from decision outcomes
- **Train/Validation/Test Split**: 70/15/15 ratio with temporal splitting

### 5.2 Model Training
- **Hyperparameter Tuning**: Grid search or Bayesian optimization
- **Cross-Validation**: Time-series cross-validation to prevent data leakage
- **Early Stopping**: Prevent overfitting with validation monitoring
- **Model Checkpointing**: Save best models during training

### 5.3 Model Evaluation
- **Performance Metrics**: Accuracy, precision, recall, F1, ROC-AUC
- **Business Metrics**: Cost impact, punctuality impact, revenue protection
- **Error Analysis**: Identify failure modes and edge cases
- **A/B Testing**: Compare new models against production models

### 5.4 Model Validation
- **Statistical Tests**: Ensure model reliability
- **Domain Expert Review**: Validate predictions with supervisors
- **Historical Backtesting**: Test on past scenarios
- **Production Readiness**: Performance benchmarks met

---

## 6. Model Serving & Inference

### 6.1 Serving Architecture
- **API Endpoints**: FastAPI REST endpoints for each model
- **Batch Inference**: Process multiple predictions efficiently
- **Real-time Inference**: <500ms response time for agent requests
- **Model Versioning**: Serve multiple model versions simultaneously

### 6.2 Inference Pipeline
- **Feature Extraction**: Convert raw data to model features
- **Preprocessing**: Apply same transformations as training
- **Model Prediction**: Run inference on trained models
- **Post-processing**: Format predictions for agent consumption

### 6.3 Performance Optimization
- **Model Quantization**: Reduce model size for faster inference
- **Caching**: Cache frequent predictions
- **Batch Processing**: Group requests for efficiency
- **GPU Acceleration**: Use GPU for deep learning models

### 6.4 Monitoring
- **Prediction Latency**: Track inference time
- **Prediction Distribution**: Monitor prediction patterns
- **Model Drift**: Detect when model performance degrades
- **Error Tracking**: Log and analyze prediction errors

---

## 7. Feedback Loop & Continuous Learning

### 7.1 Outcome Tracking
- **Decision Outcomes**: Track actual results of agent decisions
- **Performance Metrics**: Measure punctuality, maintenance, revenue impact
- **Label Generation**: Create labels from outcomes for retraining
- **Feedback Collection**: Gather supervisor feedback and overrides

### 7.2 Learning Mechanisms
- **Online Learning**: Incremental updates from new data
- **Batch Retraining**: Periodic full model retraining
- **Transfer Learning**: Adapt models to new patterns
- **Active Learning**: Identify high-value data points for labeling

### 7.3 Retraining Triggers
- **Performance Degradation**: Retrain when accuracy drops below threshold
- **Data Drift**: Retrain when data distribution changes significantly
- **Scheduled Retraining**: Weekly/monthly retraining cycles
- **Manual Trigger**: Supervisor-initiated retraining

### 7.4 Model Improvement Metrics
- **Accuracy Improvement**: Track accuracy gains over time
- **Error Reduction**: Measure decrease in prediction errors
- **Business Impact**: Quantify operational improvements
- **Learning Rate**: Speed of model adaptation

---

## 8. Integration Points

### 8.1 Backend Phase Integration
- **Reference**: See `docs/BACKEND_PHASE.md`
- **Data Source**: Historical decision data from PostgreSQL
- **Feedback Endpoint**: `/api/v1/history/feedback` for outcome submission
- **Data Export**: `/api/v1/history/decisions` for training data
- **Real-time Data**: Current train state for inference

### 8.2 Agent Phase Integration
- **Reference**: See `docs/AGENT_PHASE.md`
- **Prediction APIs**: Agents call ML models for insights
- **Feature Input**: Agents provide current train state
- **Prediction Output**: Models return predictions for agent decision-making
- **Feedback Loop**: Agent decisions feed back to models

### 8.3 Frontend Phase Integration
- **Reference**: See `docs/FRONTEND_PHASE.md`
- **Visualization**: Display ML predictions in decision cards
- **Confidence Indicators**: Show model confidence scores
- **Historical Trends**: Display learning improvement over time

---

## 9. Model Management & MLOps

### 9.1 Model Registry
- **Version Control**: Track all model versions
- **Metadata**: Store model performance, features, hyperparameters
- **Lineage**: Track data and code used for each model
- **Comparisons**: Compare model versions side-by-side

### 9.2 Model Deployment
- **Staging Environment**: Test models before production
- **Canary Deployment**: Gradual rollout of new models
- **Rollback Capability**: Revert to previous model if issues arise
- **A/B Testing**: Compare new models against production

### 9.3 Monitoring & Alerting
- **Performance Monitoring**: Track model accuracy and latency
- **Data Drift Detection**: Alert when input data distribution changes
- **Prediction Monitoring**: Monitor prediction patterns and anomalies
- **System Health**: Track model serving infrastructure

### 9.4 Governance
- **Model Approval**: Require approval before production deployment
- **Audit Logging**: Log all model changes and deployments
- **Compliance**: Ensure models meet regulatory requirements
- **Documentation**: Maintain model documentation and runbooks

---

## 10. Scalability Considerations

### 10.1 Training Scalability
- **Distributed Training**: Scale training across multiple GPUs/nodes
- **Incremental Learning**: Update models without full retraining
- **Data Sampling**: Use representative samples for large datasets
- **Parallel Processing**: Train multiple models concurrently

### 10.2 Inference Scalability
- **Horizontal Scaling**: Add more serving instances as needed
- **Load Balancing**: Distribute inference requests
- **Caching Strategy**: Cache predictions to reduce compute
- **Batch Optimization**: Process multiple requests together

### 10.3 Data Scalability
- **Data Partitioning**: Partition large datasets for efficient processing
- **Streaming Processing**: Process data in streams for real-time learning
- **Data Archival**: Archive old data while maintaining access
- **Feature Store**: Efficient feature storage and retrieval

---

## 11. Performance Optimization

### 11.1 Model Optimization
- **Model Compression**: Reduce model size without significant accuracy loss
- **Quantization**: Use lower precision for faster inference
- **Pruning**: Remove unnecessary model parameters
- **Knowledge Distillation**: Train smaller models from larger ones

### 11.2 Inference Optimization
- **Model Caching**: Cache loaded models in memory
- **Batch Inference**: Process multiple predictions together
- **Async Processing**: Handle requests asynchronously
- **GPU Utilization**: Maximize GPU usage for deep learning models

### 11.3 Data Pipeline Optimization
- **Lazy Loading**: Load data only when needed
- **Data Preprocessing Caching**: Cache preprocessed features
- **Parallel Processing**: Process features in parallel
- **Efficient Storage**: Use efficient data formats (Parquet, HDF5)

---

## 12. Error Handling & Resilience

### 12.1 Model Failures
- **Fallback Models**: Use simpler models if primary models fail
- **Default Predictions**: Provide safe defaults when models unavailable
- **Error Logging**: Log all model errors for debugging
- **Graceful Degradation**: Continue operation with reduced functionality

### 12.2 Data Quality Issues
- **Data Validation**: Validate input data before inference
- **Missing Data Handling**: Handle missing features gracefully
- **Outlier Detection**: Identify and handle anomalous inputs
- **Data Quality Monitoring**: Track data quality metrics

### 12.3 System Resilience
- **Redundancy**: Deploy multiple model instances
- **Health Checks**: Monitor model serving health
- **Automatic Recovery**: Restart failed model instances
- **Circuit Breakers**: Prevent cascade failures

---

## 13. Success Criteria Checklist

- [ ] All 6 ML models implemented and trained
- [ ] Model accuracy targets met (>90% for critical predictions)
- [ ] Real-time inference <500ms response time
- [ ] Feedback loop operational and improving accuracy
- [ ] Automated retraining pipeline functional
- [ ] Model serving infrastructure deployed
- [ ] Integration with Backend Phase tested
- [ ] Integration with Agent Phase tested
- [ ] Integration with Frontend Phase tested
- [ ] Model monitoring and alerting operational
- [ ] Performance optimization implemented
- [ ] Scalability tested for 40 trainsets
- [ ] Documentation and model registry complete
- [ ] Continuous learning showing improvement over time

---

## 14. Implementation Phases

### 14.1 Phase 1: Foundation Models
- Implement Maintenance Risk Classifier
- Implement Mileage Balancing Optimizer
- Basic training pipeline
- Integration with Backend for data

### 14.2 Phase 2: Advanced Models
- Implement Branding Compliance Forecaster
- Implement Punctuality Impact Predictor
- Implement Stabling Efficiency Optimizer
- Model serving infrastructure

### 14.3 Phase 3: Ensemble & Integration
- Implement Ensemble Combiner
- Integrate with Agent Phase
- Real-time inference optimization
- Performance tuning

### 14.4 Phase 4: Learning & Improvement
- Implement feedback loop
- Automated retraining pipeline
- Continuous learning mechanisms
- Model monitoring and alerting

### 14.5 Phase 5: Optimization & Scale
- Model optimization (compression, quantization)
- Scalability improvements
- Advanced monitoring
- Production hardening

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Next Review**: After initial model training and validation

**Note**: The ML Models Phase is critical for the continuous improvement of the system. Focus on robust training pipelines, reliable inference, and effective feedback loops to ensure the system learns and improves over time.


